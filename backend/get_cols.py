import sqlite3
import os

db_path = '/Users/banupaksoy/Desktop/capstone/backend/db.sqlite3'
output_path = '/Users/banupaksoy/Desktop/capstone/backend/db_columns.txt'

try:
    if os.path.exists(db_path):
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("PRAGMA table_info(collegetracker_directmessage)")
        rows = cursor.fetchall()
        with open(output_path, 'w') as f:
            for row in rows:
                f.write(str(row) + '\n')
        conn.close()
        print(f"Success. Check {output_path}")
    else:
        print("DB not found")
except Exception as e:
    with open(output_path, 'w') as f:
        f.write(str(e))
