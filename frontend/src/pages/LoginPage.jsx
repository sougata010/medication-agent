import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGlobalContext } from '../context/GlobalContext';
import { ArrowRight, Mail, Lock, User, Key, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import { startAuthentication } from '@simplewebauthn/browser';

const GQL_ENDPOINT = 'http://localhost:4000/graphql';

function LoginContent() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const { login } = useGlobalContext();
  const navigate = useNavigate();

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const executeGql = async (query, variables) => {
    const res = await fetch(GQL_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables })
    });
    const json = await res.json();
    if (json.errors) throw new Error(json.errors[0].message);
    return json.data;
  };

  const handleGoogleSuccess = async (tokenResponse) => {
    try {
      setIsLoading(true);
      const data = await executeGql(`
        mutation GoogleLogin($token: String!) {
          googleLogin(token: $token) {
            token
            user { id email name }
          }
        }
      `, { token: tokenResponse.access_token || tokenResponse.credential }); // Handle based on implicit vs authorization flow
      
      login(data.googleLogin.token, data.googleLogin.user);
      navigate('/dashboard');
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: () => setErrorMsg('Google login failed')
  });

  const handlePasskey = async () => {
    if (!formData.email) return setErrorMsg('Please enter your email for Passkey login.');
    try {
      setIsLoading(true);
      // 1. Get options
      const optData = await executeGql(`
        mutation GenerateOpts($email: String!) {
          generatePasskeyAuthenticationOptions(email: $email) { optionsJson }
        }
      `, { email: formData.email });
      
      // 2. Start browser webauthn
      const authResp = await startAuthentication(JSON.parse(optData.generatePasskeyAuthenticationOptions.optionsJson));
      
      // 3. Verify
      const verifyData = await executeGql(`
        mutation VerifyAuth($email: String!, $resp: String!) {
          verifyPasskeyAuthentication(email: $email, responseJson: $resp) {
            token
            user { id name email }
          }
        }
      `, { email: formData.email, resp: JSON.stringify(authResp) });

      login(verifyData.verifyPasskeyAuthentication.token, verifyData.verifyPasskeyAuthentication.user);
      navigate('/dashboard');
    } catch (err) {
      setErrorMsg('Passkey authentication failed. Have you registered one yet?');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);
    
    try {
      if (showForgot) {
        if (showOtp) {
          await executeGql(`
            mutation Reset($email: String!, $otp: String!, $newPass: String!) {
              resetPassword(email: $email, otp: $otp, newPassword: $newPass) { message }
            }
          `, { email: formData.email, otp, newPass: formData.password });
          setShowForgot(false);
          setShowOtp(false);
          setIsLogin(true);
          setErrorMsg('Password reset successfully. Please login.');
        } else {
          await executeGql(`mutation ReqReset($email: String!) { requestPasswordReset(email: $email) { message } }`, { email: formData.email });
          setShowOtp(true);
        }
      } else if (isLogin) {
        const data = await executeGql(`
          mutation Login($email: String!, $password: String!) {
            login(email: $email, password: $password) { token user { id name email } }
          }
        `, { email: formData.email, password: formData.password });
        
        login(data.login.token, data.login.user);
        navigate('/dashboard');
      } else {
        if (showOtp) {
          const data = await executeGql(`
            mutation Verify($email: String!, $otp: String!) {
              verifyOTP(email: $email, otp: $otp) { token user { id name email } }
            }
          `, { email: formData.email, otp });
          
          login(data.verifyOTP.token, data.verifyOTP.user);
          navigate('/dashboard');
        } else {
          await executeGql(`
            mutation Reg($email: String!, $password: String!, $name: String!) {
              register(email: $email, password: $password, name: $name) { message }
            }
          `, { email: formData.email, password: formData.password, name: formData.name });
          setShowOtp(true);
        }
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gray-50 relative overflow-hidden">
      
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-100/40 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-100/40 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3 pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[440px] relative z-10"
      >
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="flex items-center gap-2 cursor-pointer mb-6" onClick={() => navigate('/')}>
            <img src="/logo.png" alt="MedGraph Logo" className="w-10 h-10 object-contain drop-shadow-md" />
            <span className="font-extrabold text-2xl tracking-tight text-gray-900">MedGraph</span>
          </div>
          <h2 className="text-3xl font-heading font-extrabold text-gray-900 tracking-tight mb-2">
            {showForgot ? 'Reset Password' : (isLogin ? 'Welcome back' : 'Create account')}
          </h2>
        </div>

        <div className="bg-white rounded-[2rem] p-8 md:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-100 relative overflow-hidden">
          
          <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-600 text-sm font-medium rounded-lg text-center border border-red-100">
                {errorMsg}
              </div>
            )}

            {!showOtp ? (
              <>
                <AnimatePresence mode="popLayout">
                  {!isLogin && !showForgot && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
                      <div className="relative mb-5">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><User className="h-5 w-5 text-gray-400" /></div>
                        <input name="name" type="text" className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" placeholder="Sarah Connor" value={formData.name} onChange={handleInputChange} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Mail className="h-5 w-5 text-gray-400" /></div>
                    <input name="email" type="email" className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" placeholder="sarah@example.com" value={formData.email} onChange={handleInputChange} />
                  </div>
                </div>

                {!showForgot || showOtp ? (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">{showForgot ? 'New Password' : 'Password'}</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Lock className="h-5 w-5 text-gray-400" /></div>
                      <input name="password" type="password" className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" placeholder="••••••••" value={formData.password} onChange={handleInputChange} />
                    </div>
                  </div>
                ) : null}
              </>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <label className="block text-sm font-bold text-gray-700 mb-2">Enter OTP from Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><ShieldCheck className="h-5 w-5 text-gray-400" /></div>
                  <input type="text" className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-center tracking-[0.5em] font-mono text-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" placeholder="123456" value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={6} />
                </div>
              </motion.div>
            )}

            <button type="submit" className="w-full py-3.5 px-6 rounded-xl text-white font-bold text-sm bg-blue-600 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 flex justify-center items-center" disabled={isLoading}>
              {isLoading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : (showOtp ? 'Verify OTP' : (showForgot ? 'Send Reset Link' : (isLogin ? 'Sign In' : 'Create Account')))}
            </button>
          </form>

          {!showOtp && !showForgot && (
            <div className="mt-6">
              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-gray-100"></div>
                <span className="flex-shrink-0 mx-4 text-xs font-bold text-gray-400 uppercase tracking-wider">OR</span>
                <div className="flex-grow border-t border-gray-100"></div>
              </div>
              
              <div className="flex flex-col gap-3 mt-4">
                <button onClick={() => googleLogin()} className="w-full py-3 px-6 rounded-xl border border-gray-200 bg-white text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors flex justify-center items-center gap-2">
                  <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                  Continue with Google
                </button>
                <button onClick={handlePasskey} className="w-full py-3 px-6 rounded-xl border border-gray-200 bg-white text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors flex justify-center items-center gap-2">
                  <Key className="w-4 h-4 text-gray-500" /> Sign in with Passkey
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 text-center text-sm text-gray-500 font-medium space-x-3">
          {showForgot || showOtp ? (
            <button onClick={() => { setShowForgot(false); setShowOtp(false); }} className="text-blue-600 font-bold hover:text-blue-700">Back to Login</button>
          ) : (
            <>
              <span>{isLogin ? "Don't have an account?" : "Already have an account?"}</span>
              <button onClick={() => setIsLogin(!isLogin)} className="text-blue-600 font-bold hover:text-blue-700">{isLogin ? 'Sign up' : 'Sign in'}</button>
              <span className="text-gray-300">|</span>
              <button onClick={() => setShowForgot(true)} className="text-gray-400 hover:text-gray-600">Forgot Password?</button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env?.VITE_GOOGLE_OAUTH_CLIENT_ID || "12345-mock-id.apps.googleusercontent.com"}>
      <LoginContent />
    </GoogleOAuthProvider>
  );
}
