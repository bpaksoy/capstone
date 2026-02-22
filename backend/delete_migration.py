import os
path = '/Users/banupaksoy/Desktop/capstone/backend/collegetracker/migrations/0027_directmessage_is_edited.py'
if os.path.exists(path):
    os.remove(path)
    print(f"Deleted {path}")
else:
    print(f"File {path} not found")
