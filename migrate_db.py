import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), 'medgraph.db')
print(f"Migrating database at {db_path}")

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# 1. Add streak_days and badges to users table
try:
    cursor.execute("ALTER TABLE users ADD COLUMN streak_days INTEGER DEFAULT 0")
    print("Added streak_days to users.")
except sqlite3.OperationalError as e:
    print(f"streak_days error: {e}")

try:
    cursor.execute("ALTER TABLE users ADD COLUMN badges TEXT DEFAULT '[]'")
    print("Added badges to users.")
except sqlite3.OperationalError as e:
    print(f"badges error: {e}")

# 2. Add mood to health_logs
try:
    cursor.execute("ALTER TABLE health_logs ADD COLUMN mood TEXT")
    print("Added mood to health_logs.")
except sqlite3.OperationalError as e:
    print(f"mood error: {e}")

# 3. Create symptom_logs table
cursor.execute("""
CREATE TABLE IF NOT EXISTS symptom_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    symptoms TEXT NOT NULL,
    logged_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
)
""")
print("Created symptom_logs table.")

# 4. Create community_posts table
cursor.execute("""
CREATE TABLE IF NOT EXISTS community_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    author TEXT NOT NULL,
    content TEXT NOT NULL,
    tags TEXT NOT NULL,
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
""")
print("Created community_posts table.")

conn.commit()
conn.close()
print("Migration complete!")
