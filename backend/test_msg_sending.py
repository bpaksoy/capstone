import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'collegetracker.settings')
django.setup()

from collegetracker.models import User, DirectMessage, Notification
from django.contrib.contenttypes.models import ContentType

try:
    s = User.objects.filter(is_superuser=True).first()
    r = User.objects.exclude(id=s.id).first()
    print(f"Testing from {s.username} to {r.username}")
    
    msg = DirectMessage.objects.create(
        sender=s,
        recipient=r,
        content="Test from script"
    )
    print(f"Message created: {msg.id}")
    
    noti = Notification.objects.create(
        recipient=r,
        sender=s,
        notification_type='direct_message',
        content_type=ContentType.objects.get_for_model(DirectMessage),
        object_id=msg.id
    )
    print(f"Notification created: {noti.id}")
    print("TEST PASSED")
except Exception as e:
    import traceback
    print("TEST FAILED")
    traceback.print_exc()
