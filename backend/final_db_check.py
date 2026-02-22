import sqlite3
import os

db_path = '/Users/banupaksoy/Desktop/capstone/backend/db.sqlite3'
try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("PRAGMA table_info(collegetracker_directmessage)")
    cols = cursor.fetchall()
    print("COLUMNS FOUND:", [c[1] for c in cols])
    conn.close()
except Exception as e:
    print("ERROR:", e)
