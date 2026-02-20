import requests
from django.core.management.base import BaseCommand
from django.core.files.base import ContentFile
from django.db import models
from collegetracker.models import College
import time
import re

class Command(BaseCommand):
    help = 'Smart seeds colleges with real campus images (Wikipedia) and logos (Clearbit).'

    def add_arguments(self, parser):
        parser.add_argument('--limit', type=int, default=10, help='Limit the number of colleges to process')
        parser.add_argument('--all', action='store_true', help='Process all colleges')
        parser.add_argument('--featured', action='store_true', help='Prioritize featured colleges (MA, NY, CA)')
        parser.add_argument('--force', action='store_true', help='Overwrite existing images')
        parser.add_argument('--force-wiki', action='store_true', help='Specifically re-try Wikipedia even if image exists')

    def get_wikipedia_image(self, college_name):
        headers = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
        
        # Variations to find real campus photos
        search_terms = [f"Campus of {college_name}", college_name, f"{college_name} university landscape"]
        
        for term in search_terms:
            try:
                params = {
                    "action": "query",
                    "generator": "search",
                    "gsrsearch": term,
                    "gsrlimit": 5, # Look at top results for better photos
                    "prop": "pageimages",
                    "pithumbsize": 1000, # Get a good res
                    "format": "json"
                }
                res = requests.get("https://en.wikipedia.org/w/api.php", params=params, headers=headers, timeout=5).json()
                pages = res.get("query", {}).get("pages", {})
                
                candidates = []
                for pid in pages:
                    page = pages[pid]
                    img_url = page.get("thumbnail", {}).get("source") # Usually better than 'original' for filtering
                    if not img_url: continue
                    
                    # Score the image
                    score = 0
                    low_url = img_url.lower()
                    if any(x in low_url for x in ['campus', 'aerial', 'building', 'library', 'quad', 'hall']): score += 10
                    if any(x in low_url for x in ['logo', 'seal', 'crest', 'arms', 'svg', 'icon']): score -= 20
                    if low_url.endswith('.svg') or low_url.endswith('.png'): score -= 50
                    
                    candidates.append((score, img_url))
                
                if candidates:
                    candidates.sort(key=lambda x: x[0], reverse=True)
                    best_img = candidates[0][1]
                    # Convert thumb URL back to original or just use it
                    # Wikipedia thumbs look like: .../thumb/path/to/img.jpg/1000px-img.jpg
                    if '/thumb/' in best_img:
                        original_url = best_img.split('/thumb/')[1].rsplit('/', 1)[0]
                        original_url = f"https://upload.wikimedia.org/wikipedia/commons/thumb/{original_url}/1200px-{original_url.split('/')[-1]}"
                        return original_url
                    return best_img
                    
            except Exception:
                continue
        return None

    def handle(self, *args, **options):
        limit = options['limit']
        force = options['force']
        force_wiki = options['force_wiki']
        
        if options['featured']:
            # Specifically target colleges that show up in the "Featured" section
            colleges = College.objects.filter(
                state__in=['MA', 'NY', 'CA'],
                admission_rate__isnull=False,
                admission_rate__gt=0.0
            ).order_by('admission_rate')
            if not options['all']:
                colleges = colleges[:limit]
        else:
            # Only process colleges that are missing either a logo OR an image
            query = College.objects.filter(models.Q(logo_url__isnull=True) | models.Q(image__isnull=True) | models.Q(logo_url=''))
            if options['all']:
                colleges = query
            else:
                colleges = query.order_by('id')[:limit]

        total = colleges.count()
        if total == 0:
            self.stdout.write(self.style.SUCCESS("All colleges already have branding! Nothing to do."))
            return

        self.stdout.write(f"Processing {total} colleges for smart branding...")

        import random
        user_agents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.63 Safari/537.36'
        ]
        
        success_count = 0
        for college in colleges:
            # Respectful delay for APIs - increased to avoid 429
            time.sleep(2)
            self.stdout.write(f"Analyzing {college.name}...")
            
            headers = {'User-Agent': random.choice(user_agents)}

            # 1. Update Logo via Clearbit (if we have a website)
            if not college.logo_url or force:
                try:
                    domain = college.website.replace('http://', '').replace('https://', '').split('/')[0]
                    if domain.startswith('www.'): domain = domain[4:]
                    college.logo_url = f"https://logo.clearbit.com/{domain}"
                except:
                    pass

            # 2. Update Image (Check if legacy or forced)
            is_generic = college.image and re.match(r'college_\d+_image\.jpg', college.image.name.split('/')[-1])
            
            if not college.image or is_generic or force:
                self.stdout.write(f"  Attempting to refresh image for {college.name}...")
                new_image_data = None
                
                # Try Wikipedia first
                wiki_img = self.get_wikipedia_image(college.name)
                if wiki_img:
                    # Skip SVG logos as backgrounds
                    if wiki_img.lower().endswith('.svg'):
                        self.stdout.write(f"  Skipping Wikipedia SVG: {wiki_img}")
                    else:
                        try:
                            self.stdout.write(f"  Downloading Wikipedia Image: {wiki_img}")
                            response = requests.get(wiki_img, headers=headers, timeout=10)
                            if response.status_code == 200:
                                new_image_data = (f"college_{college.id}_wiki.jpg", response.content)
                            elif response.status_code == 429:
                                self.stdout.write(self.style.WARNING("  Wikipedia rate limit hit. Switching to Unsplash fallback..."))
                                # Don't sleep too long here, just let the next step handle it
                            else:
                                self.stdout.write(f"  Wikipedia download failed (status {response.status_code})")
                        except Exception as wiki_err:
                            self.stdout.write(f"  Wikipedia download error: {wiki_err}")
                
                # Fallback to Unsplash specific query
                if not new_image_data:
                    try:
                        query_str = f"university,campus,{college.name}".replace(' ', ',')
                        unsplash_url = f"https://images.unsplash.com/featured/?{query_str}"
                        self.stdout.write(f"  Trying Unsplash fallback: {unsplash_url}")
                        response = requests.get(unsplash_url, headers=headers, timeout=10)
                        if response.status_code == 200:
                            new_image_data = (f"college_{college.id}_unsplash.jpg", response.content)
                        else:
                            # Try one more generic one
                            generic_url = f"https://images.unsplash.com/featured/?university,campus"
                            response = requests.get(generic_url, headers=headers, timeout=10)
                            if response.status_code == 200:
                                new_image_data = (f"college_{college.id}_unsplash_gen.jpg", response.content)
                    except Exception:
                        pass
                
                if new_image_data:
                    file_name, content = new_image_data
                    college.image.save(file_name, ContentFile(content), save=False)
                    self.stdout.write(self.style.SUCCESS(f"  Successfully updated image to {file_name}"))
                else:
                    self.stdout.write(self.style.WARNING(f"  Could not find a new image for {college.name}"))
            
            college.save()
            success_count += 1
            if success_count % 5 == 0:
                self.stdout.write(self.style.SUCCESS(f"Progress: {success_count}/{total}"))

        self.stdout.write(self.style.SUCCESS(f"Finished. Successfully processed {success_count} colleges."))
