import os
import django
import sys

# Set up Django environment
sys.path.append('/Users/banupaksoy/Desktop/capstone/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'collegetracker.settings')
django.setup()

from collegetracker.models import DirectMessage, User
from django.db.models import Q

def debug_fetch():
    print("Testing DirectMessage.objects.all()...")
    try:
        msgs = DirectMessage.objects.all()[:5]
        print(f"Found {msgs.count()} messages.")
        for m in msgs:
            print(f"Msg ID: {m.id}, Content: {m.content[:20] if m.content else 'None'}")
    except Exception as e:
        print(f"CRASH in all(): {e}")
        import traceback
        traceback.print_exc()

    print("\nTesting get_messages logic...")
    try:
        # Simulate a user
        user = User.objects.first()
        if not user:
            print("No users found to test with.")
            return
            
        messages = DirectMessage.objects.filter(
            Q(sender=user) | Q(recipient=user)
        ).order_by('created_at')
        
        data = []
        for m in messages:
            data.append({
                "id": m.id,
                "sender_id": m.sender.id,
                "content": m.content,
                "created_at": m.created_at,
                "is_read": m.is_read
            })
        print(f"Successfully processed {len(data)} messages for user {user.username}")
    except Exception as e:
        print(f"CRASH in logic: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    debug_fetch()
