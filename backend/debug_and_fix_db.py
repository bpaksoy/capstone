import sqlite3
import os

db_path = '/Users/banupaksoy/Desktop/capstone/backend/db.sqlite3'
with open('schema_check.txt', 'w') as f:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("PRAGMA table_info(collegetracker_directmessage)")
    cols = [c[1] for c in cursor.fetchall()]
    f.write(f"COLUMNS: {cols}\n")
    
    if 'is_edited' not in cols:
        f.write("is_edited NOT FOUND. Attempting add...\n")
        try:
            cursor.execute("ALTER TABLE collegetracker_directmessage ADD COLUMN is_edited BOOLEAN DEFAULT 0")
            conn.commit()
            f.write("ADD SUCCESSFUL\n")
        except Exception as e:
            f.write(f"ADD FAILED: {e}\n")
    else:
        f.write("is_edited ALREADY EXISTS\n")
    conn.close()
