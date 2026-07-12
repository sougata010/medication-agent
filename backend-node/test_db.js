const db = require('./db');

async function run() {
  try {
    const res = await db.query('SELECT * FROM users WHERE id = $1', ['1']);
    console.log("Users:", res.rows);
    
    // Now try insert
    const insertRes = await db.query(
      `INSERT INTO users (name, age, gender, language, reminder_channel, created_at) 
       VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *`,
      ['Test', 30, 'Male', 'en', 'Email']
    );
    console.log("Insert:", insertRes.rows);
  } catch (err) {
    console.error("DB Error:", err);
  }
}

run();
