import requests
from django.core.management.base import BaseCommand
from django.core.files.base import ContentFile
from collegetracker.models import College
import random
import time

class Command(BaseCommand):
    help = 'Downloads and assigns random Unsplash images to colleges that do not have one.'

    def handle(self, *args, **kwargs):
        # List of Unsplash images from the frontend constants
        college_images = [
            "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1592280771190-3e2e4d571952?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1562774053-701939374585?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1590012314607-cda9d9b699ae?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1525921429624-479b6a26d84d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1607237138186-b450704407cc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1581362072978-14998d01fdaa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1564981797816-1043664bf78d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1591123120675-6f7f4a5481d7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1462536943532-57a629f6cc60?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1535982330050-f1c2fb970584?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
        ]

        colleges = College.objects.filter(image__isnull=True)  # Or filtering based on existing image
        total = colleges.count()
        self.stdout.write(f"Found {total} colleges without images. Starting download...")

        # Pre-download images to avoid repeated requests if we are just cycling through same set
        downloaded_images = []
        for i, url in enumerate(college_images):
            try:
                response = requests.get(url, timeout=10)
                if response.status_code == 200:
                    downloaded_images.append(response.content)
                    self.stdout.write(f"Pre-downloaded image {i+1}/{len(college_images)}")
                else:
                    self.stdout.write(self.style.WARNING(f"Failed to download image from {url}"))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Error downloading {url}: {e}"))

        if not downloaded_images:
            self.stdout.write(self.style.ERROR("No images downloaded. Aborting."))
            return

        count = 0
        for college in colleges:
            try:
                # Cycle through downloaded images
                img_content = downloaded_images[count % len(downloaded_images)]
                
                # Create a unique filename for the image per college, though content is reused
                # Using college ID helps avoid filename collisions in upload_to path if needed
                file_name = f"college_{college.id}_image.jpg"
                
                college.image.save(file_name, ContentFile(img_content), save=True)
                
                count += 1
                if count % 10 == 0:
                    self.stdout.write(f"Processed {count}/{total} colleges...")
                    
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Error saving image for {college.name}: {e}"))

        self.stdout.write(self.style.SUCCESS(f"Successfully updated {count} colleges with images."))
