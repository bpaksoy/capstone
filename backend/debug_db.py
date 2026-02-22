from collegetracker.models import DirectMessage, User
with open('debug_msgs.txt', 'w') as f:
    f.write(f'Total Users: {User.objects.count()}\n')
    f.write(f'Total Messages: {DirectMessage.objects.count()}\n')
    msgs = DirectMessage.objects.all().order_by('-created_at')[:10]
    for m in msgs:
        f.write(f'[{m.created_at}] From {m.sender.username} to {m.recipient.username}: {m.content[:50]}\n')
