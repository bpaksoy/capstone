import requests
from django.core.files.base import ContentFile
from collegetracker.models import College

def manual_fix():
    targets = {
        'Harvard University': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Harvard_University_aerial.jpg/1200px-Harvard_University_aerial.jpg',
        'Fordham University': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Fordham_University_Keating_Hall.jpg/1200px-Fordham_University_Keating_Hall.jpg',
        'Stanford University': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Stanford_University_aerial_view.jpg/1200px-Stanford_University_aerial_view.jpg',
        'California Institute of Technology': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/CalTech_Millikan_Library.jpg/1200px-CalTech_Millikan_Library.jpg'
    }
    
    headers = {'User-Agent': 'Mozilla/5.0'}
    
    for name, url in targets.items():
        try:
            college = College.objects.get(name=name)
            print(f"Fixing {name}...")
            res = requests.get(url, headers=headers)
            if res.status_code == 200:
                college.image.save(f"college_{college.id}_manual.jpg", ContentFile(res.content), save=True)
                print(f"  Success!")
        except Exception as e:
            print(f"  Error fixing {name}: {e}")

if __name__ == "__main__":
    manual_fix()
