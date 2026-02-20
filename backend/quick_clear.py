from collegetracker.models import College
import re

# This script clears the old generic stock photos so the 'Smart' frontend can take over
def run():
    count = 0
    # Process the first 500 colleges (includes all featured ones)
    colleges = College.objects.all().order_by('id')[:500]
    for c in colleges:
        if c.image:
            filename = c.image.name.split('/')[-1]
            if re.match(r'college_\d+_image\.jpg', filename):
                c.image = None
                c.save()
                count += 1
    print(f"Cleared {count} generic images. The frontend will now use dynamic Unsplash shots.")

if __name__ == "__main__":
    run()
