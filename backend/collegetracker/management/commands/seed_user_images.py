import requests
import random
from django.core.management.base import BaseCommand
from django.core.files.base import ContentFile
from django.contrib.auth import get_user_model
import time

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds users with diverse, high-quality profile pictures to replace placeholders.'

    def handle(self, *args, **kwargs):
        self.stdout.write("Fetching diverse profile pictures for users...")
        
        # We'll use a mix of sources for variety
        # 1. Random User API
        # 2. UI Faces (if possible)
        # 3. Carefully selected Unsplash portraits
        
        users_without_images = User.objects.filter(image__in=['', None])
        total = users_without_images.count()
        
        if total == 0:
            self.stdout.write(self.style.SUCCESS("All users already have profile pictures!"))
            return

        self.stdout.write(f"Processing {total} users...")
        
        for i, user in enumerate(users_without_images):
            try:
                # Use Random User for a clean, diverse look
                gender = random.choice(['male', 'female'])
                res = requests.get(f"https://randomuser.me/api/?gender={gender}").json()
                img_url = res['results'][0]['picture']['large']
                
                self.stdout.write(f"  Downloading image for {user.username}: {img_url}")
                img_res = requests.get(img_url, timeout=10)
                
                if img_res.status_code == 200:
                    user.image.save(f"user_{user.id}_avatar.jpg", ContentFile(img_res.content), save=True)
                    self.stdout.write(self.style.SUCCESS(f"  Updated {user.username}"))
                
                # Respectful delay
                time.sleep(1)
                
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"  Failed for {user.username}: {e}"))

        self.stdout.write(self.style.SUCCESS(f"Successfully processed {total} users."))
