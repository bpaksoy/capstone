from collegetracker.models import College
import re

def clear_generic_images():
    count = 0
    colleges = College.objects.all()
    for c in colleges:
        if c.image:
            # Check if it matches the legacy pattern 'college_X_image.jpg'
            filename = c.image.name.split('/')[-1]
            if re.match(r'^college_\d+_image\.jpg$', filename):
                print(f"Clearing generic image for: {c.name}")
                c.image = None
                c.save()
                count += 1
    print(f"Successfully cleared {count} generic images.")

if __name__ == "__main__":
    clear_generic_images()
