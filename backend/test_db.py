import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'collegetracker.settings')
django.setup()

from collegetracker.models import User, DirectMessage

print("Users:")
for u in User.objects.all():
    print(f"ID: {u.id}, Name: {u.username}, Role: {u.role}")
