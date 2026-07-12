const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { OAuth2Client } = require('google-auth-library');
const { generateRegistrationOptions, verifyRegistrationResponse, generateAuthenticationOptions, verifyAuthenticationResponse } = require('@simplewebauthn/server');
const db = require('./db');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-medgraph-key-change-in-prod';
const googleClient = new OAuth2Client(process.env.GOOGLE_OAUTH_CLIENT_ID);
const rpID = 'localhost'; // WebAuthn Relying Party ID
const expectedOrigin = 'http://localhost:5173';

// Nodemailer config
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const sendEmail = async (to, subject, text) => {
  try {
    // If credentials are missing or default, just log the email to the console (useful for development)
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_USER === 'your_email@gmail.com') {
      console.log(`\n\x1b[36m[MOCK EMAIL]\x1b[0m To: ${to}`);
      console.log(`\x1b[36m[MOCK EMAIL]\x1b[0m Subject: ${subject}`);
      console.log(`\x1b[36m[MOCK EMAIL]\x1b[0m Text: ${text}\n`);
      return;
    }
    await transporter.sendMail({ from: process.env.GMAIL_USER, to, subject, text });
  } catch (e) {
    console.error('Email error:', e.message);
    // Fallback: If sending fails, still log the OTP so the developer isn't locked out!
    console.log(`\n\x1b[33m[FALLBACK EMAIL LOG]\x1b[0m To: ${to}`);
    console.log(`\x1b[33m[FALLBACK EMAIL LOG]\x1b[0m Text: ${text}\n`);
  }
};

const authResolvers = {
  register: async (_, { email, password, name }) => {
    const client = await db.pool.connect();
    try {
      const existingUser = await client.query('SELECT * FROM users WHERE email = $1', [email]);
      
      let userId;
      const hash = await bcrypt.hash(password, 10);
      const otp = generateOTP();
      const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

      if (existingUser.rows.length > 0) {
        if (existingUser.rows[0].is_verified) {
          throw new Error('Email already registered.');
        } else {
          // Allow re-registration for unverified accounts
          userId = existingUser.rows[0].id;
          await client.query(
            `UPDATE users SET password_hash = $1, name = $2, otp_code = $3, otp_expiry = $4 WHERE id = $5`,
            [hash, name, otp, expiry, userId]
          );
        }
      } else {
        const userRes = await client.query(
          `INSERT INTO users (email, password_hash, name, otp_code, otp_expiry) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
          [email, hash, name, otp, expiry]
        );
        userId = userRes.rows[0].id;
        await client.query(`INSERT INTO medical_profiles (user_id, allergies, conditions, pregnancy_status, emergency_contacts) VALUES ($1, '[]', '[]', false, '{}')`, [userId]);
      }

      await sendEmail(email, 'Your MedGraph Verification Code', `Your OTP code is: ${otp}`);
      
      return { token: null, user: null, message: 'OTP sent to email.' };
    } finally {
      client.release();
    }
  },

  verifyOTP: async (_, { email, otp }) => {
    const res = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (res.rows.length === 0) throw new Error('User not found.');
    const user = res.rows[0];

    if (user.is_verified) throw new Error('Already verified.');
    if (user.otp_code !== otp || new Date(user.otp_expiry) < new Date()) {
      throw new Error('Invalid or expired OTP.');
    }

    await db.query('UPDATE users SET is_verified = true, otp_code = null, otp_expiry = null WHERE id = $1', [user.id]);
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    return { token, user: { id: user.id, email: user.email, name: user.name }, message: 'Verified successfully.' };
  },

  login: async (_, { email, password }) => {
    const res = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (res.rows.length === 0) throw new Error('Invalid credentials.');
    const user = res.rows[0];

    if (!user.password_hash) throw new Error('Please login with your original provider (Google/Passkey).');
    
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) throw new Error('Invalid credentials.');

    if (!user.is_verified) throw new Error('Please verify your email before logging in.');

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    return { token, user: { id: user.id, email: user.email, name: user.name }, message: 'Login successful.' };
  },

  googleLogin: async (_, { token }) => {
    const ticket = await googleClient.verifyIdToken({ idToken: token, audience: process.env.GOOGLE_OAUTH_CLIENT_ID });
    const payload = ticket.getPayload();
    const { email, name, sub: googleId } = payload;

    const client = await db.pool.connect();
    try {
      let userRes = await client.query('SELECT * FROM users WHERE email = $1', [email]);
      let user;

      if (userRes.rows.length === 0) {
        userRes = await client.query(
          `INSERT INTO users (email, name, google_id, is_verified) VALUES ($1, $2, $3, true) RETURNING *`,
          [email, name, googleId]
        );
        user = userRes.rows[0];
        await client.query(`INSERT INTO medical_profiles (user_id, allergies, conditions, pregnancy_status, emergency_contacts) VALUES ($1, '[]', '[]', false, '{}')`, [user.id]);
      } else {
        user = userRes.rows[0];
        if (!user.google_id) await client.query('UPDATE users SET google_id = $1 WHERE id = $2', [googleId, user.id]);
      }

      const jwtToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
      return { token: jwtToken, user: { id: user.id, email: user.email, name: user.name }, message: 'Google login successful.' };
    } finally {
      client.release();
    }
  },

  requestPasswordReset: async (_, { email }) => {
    const res = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (res.rows.length === 0) return { message: 'If an account exists, a reset code has been sent.' };
    
    const otp = generateOTP();
    const expiry = new Date(Date.now() + 15 * 60 * 1000);
    await db.query('UPDATE users SET otp_code = $1, otp_expiry = $2 WHERE id = $3', [otp, expiry, res.rows[0].id]);
    await sendEmail(email, 'MedGraph Password Reset', `Your reset code is: ${otp}`);
    return { message: 'If an account exists, a reset code has been sent.' };
  },

  resetPassword: async (_, { email, otp, newPassword }) => {
    const res = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (res.rows.length === 0) throw new Error('Invalid request.');
    const user = res.rows[0];

    if (user.otp_code !== otp || new Date(user.otp_expiry) < new Date()) throw new Error('Invalid or expired OTP.');
    
    const hash = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password_hash = $1, otp_code = null, otp_expiry = null WHERE id = $2', [hash, user.id]);
    return { message: 'Password reset successfully.' };
  },

  // PASSKEYS (WebAuthn)
  generatePasskeyRegistrationOptions: async (_, { email }) => {
    const res = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (res.rows.length === 0) throw new Error('User not found.');
    const user = res.rows[0];

    const existingCreds = await db.query('SELECT credential_id FROM webauthn_credentials WHERE user_id = $1', [user.id]);
    const excludeCredentials = existingCreds.rows.map(row => ({ id: Buffer.from(row.credential_id, 'base64url'), type: 'public-key' }));

    const options = await generateRegistrationOptions({
      rpName: 'MedGraph AI',
      rpID,
      userID: user.id.toString(),
      userName: user.email,
      attestationType: 'none',
      excludeCredentials,
      authenticatorSelection: { residentKey: 'required', userVerification: 'preferred' }
    });

    await db.query('UPDATE users SET otp_code = $1 WHERE id = $2', [options.challenge, user.id]); // Store challenge temporarily in otp_code
    return { challenge: options.challenge, optionsJson: JSON.stringify(options) };
  },

  verifyPasskeyRegistration: async (_, { email, responseJson }) => {
    const res = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = res.rows[0];
    const expectedChallenge = user.otp_code;
    
    const verification = await verifyRegistrationResponse({
      response: JSON.parse(responseJson),
      expectedChallenge,
      expectedOrigin,
      expectedRPID: rpID,
    });

    if (verification.verified && verification.registrationInfo) {
      const { credentialID, credentialPublicKey, counter } = verification.registrationInfo;
      await db.query(
        'INSERT INTO webauthn_credentials (user_id, credential_id, public_key, counter) VALUES ($1, $2, $3, $4)',
        [user.id, Buffer.from(credentialID).toString('base64url'), Buffer.from(credentialPublicKey).toString('base64url'), counter]
      );
      await db.query('UPDATE users SET otp_code = null WHERE id = $1', [user.id]);
      return { message: 'Passkey registered successfully.' };
    }
    throw new Error('Passkey verification failed.');
  },

  generatePasskeyAuthenticationOptions: async (_, { email }) => {
    const res = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (res.rows.length === 0) throw new Error('User not found.');
    const user = res.rows[0];

    const credsRes = await db.query('SELECT * FROM webauthn_credentials WHERE user_id = $1', [user.id]);
    const allowCredentials = credsRes.rows.map(row => ({
      id: Buffer.from(row.credential_id, 'base64url'),
      type: 'public-key',
    }));

    const options = await generateAuthenticationOptions({ rpID, allowCredentials, userVerification: 'preferred' });
    await db.query('UPDATE users SET otp_code = $1 WHERE id = $2', [options.challenge, user.id]);
    return { challenge: options.challenge, optionsJson: JSON.stringify(options) };
  },

  verifyPasskeyAuthentication: async (_, { email, responseJson }) => {
    const res = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = res.rows[0];
    const expectedChallenge = user.otp_code;
    const body = JSON.parse(responseJson);

    const credRes = await db.query('SELECT * FROM webauthn_credentials WHERE credential_id = $1', [body.id]);
    if (credRes.rows.length === 0) throw new Error('Passkey not found.');
    const cred = credRes.rows[0];

    const verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin,
      expectedRPID: rpID,
      authenticator: {
        credentialPublicKey: Buffer.from(cred.public_key, 'base64url'),
        credentialID: Buffer.from(cred.credential_id, 'base64url'),
        counter: cred.counter,
      }
    });

    if (verification.verified) {
      await db.query('UPDATE webauthn_credentials SET counter = $1 WHERE id = $2', [verification.authenticationInfo.newCounter, cred.id]);
      await db.query('UPDATE users SET otp_code = null WHERE id = $1', [user.id]);
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
      return { token, user: { id: user.id, email: user.email, name: user.name }, message: 'Passkey login successful.' };
    }
    throw new Error('Passkey authentication failed.');
  }
};

module.exports = authResolvers;
