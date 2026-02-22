import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'collegetracker.settings')
django.setup()

from django.db import connection

with connection.cursor() as cursor:
    cursor.execute("PRAGMA table_info(collegetracker_directmessage)")
    columns = cursor.fetchall()
    print("Columns in collegetracker_directmessage:")
    for col in columns:
        print(f" - {col[1]} ({col[2]})")
