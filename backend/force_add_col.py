import sqlite3
import os

db_path = '/Users/banupaksoy/Desktop/capstone/backend/db.sqlite3'
print(f"Checking database at: {db_path}")

if not os.path.exists(db_path):
    print("Database file does not exist!")
else:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("PRAGMA table_info(collegetracker_directmessage)")
    columns = [col[1] for col in cursor.fetchall()]
    print(f"Current columns: {columns}")
    
    if 'is_edited' not in columns:
        print("Adding column is_edited...")
        try:
            cursor.execute("ALTER TABLE collegetracker_directmessage ADD COLUMN is_edited BOOLEAN DEFAULT 0 NOT NULL")
            conn.commit()
            print("Successfully added column.")
        except Exception as e:
            print(f"Error adding column: {e}")
    else:
        print("Column is_edited already exists.")
    
    conn.close()
