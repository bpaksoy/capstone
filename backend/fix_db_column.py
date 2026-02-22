import sqlite3
import os

db_path = '/Users/banupaksoy/Desktop/capstone/backend/db.sqlite3'
log_path = '/Users/banupaksoy/Desktop/capstone/backend/column_fix.log'

with open(log_path, 'w') as log:
    log.write(f"Checking database at: {db_path}\n")

    if not os.path.exists(db_path):
        log.write("Database file does not exist!\n")
    else:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check tables first
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = [t[0] for t in cursor.fetchall()]
        log.write(f"Tables in DB: {tables}\n")
        
        target_table = 'collegetracker_directmessage'
        if target_table not in tables:
            log.write(f"ERROR: Table {target_table} not found!\n")
        else:
            cursor.execute(f"PRAGMA table_info({target_table})")
            columns = [col[1] for col in cursor.fetchall()]
            log.write(f"Current columns in {target_table}: {columns}\n")
            
            if 'is_edited' not in columns:
                log.write("Adding column is_edited...\n")
                try:
                    cursor.execute(f"ALTER TABLE {target_table} ADD COLUMN is_edited BOOLEAN DEFAULT 0")
                    conn.commit()
                    log.write("Successfully added column.\n")
                except Exception as e:
                    log.write(f"Error adding column: {e}\n")
            else:
                log.write("Column is_edited already exists.\n")
        
        conn.close()
    log.write("Done.\n")
