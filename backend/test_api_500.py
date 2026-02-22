import os
import django
import sys
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

# Set up Django environment
sys.path.append('/Users/banupaksoy/Desktop/capstone/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'collegetracker.settings')
django.setup()

User = get_user_model()

def test_api():
    client = APIClient()
    user = User.objects.first()
    if not user:
        print("No user found.")
        return
        
    client.force_authenticate(user=user)
    print(f"Testing /api/messages/ for user: {user.username}")
    
    try:
        response = client.get('/api/messages/')
        print(f"Status Code: {response.status_code}")
        if response.status_code == 500:
            print("500 ERROR DETECTED")
            # In a real 500, response.data might have the error if DEBUG=True
            print(f"Response Data: {response.data}")
        else:
            print("Success or non-500 status.")
            
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_api()
