import os
import django
import sys

# Set up Django environment
sys.path.append('/Users/banupaksoy/Desktop/capstone/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'collegetracker.settings')
django.setup()

from collegetracker.models import DirectMessage, User
from django.db.models import Q
import traceback

def diagnostic():
    try:
        user = User.objects.first()
        if not user:
            print("No users found.")
            return

        other_user = User.objects.exclude(id=user.id).first()
        if not other_user:
            print(f"Only one user found: {user.username}. Cannot test thread.")
            # Test general list
            qs = DirectMessage.objects.filter(Q(sender=user) | Q(recipient=user))
            print(f"General count for {user.username}: {qs.count()}")
            return

        print(f"Testing with user {user.username} (ID: {user.id}) and other_user {other_user.username} (ID: {other_user.id})")
        
        # Test the filter logic used in get_messages
        qs = DirectMessage.objects.filter(
            (Q(sender=user) & Q(recipient_id=other_user.id)) |
            (Q(sender_id=other_user.id) & Q(recipient=user))
        ).order_by('created_at')
        
        print(f"Found {qs.count()} messages.")
        
        # Force evaluation and access fields
        for msg in qs:
            print(f"Message ID: {msg.id}, Sender: {msg.sender.username}, Content: {msg.content[:20] if msg.content else 'N/A'}")
            
        print("Success evaluating queryset.")

        # Test notification creation (common source of errors if model is out of sync)
        print("Testing DirectMessage.objects.create...")
        # (Don't actually create if we want to be safe, but we need to find the error)
        # message = DirectMessage.objects.create(sender=user, recipient=other_user, content="Diagnostic check")
        # print(f"Created message ID: {message.id}")
        
    except Exception as e:
        print("DIAGNOSTIC FAILED")
        traceback.print_exc()

if __name__ == "__main__":
    diagnostic()
