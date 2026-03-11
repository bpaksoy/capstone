import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'collegetracker.settings')
django.setup()

from collegetracker.models import User

try:
    User.objects.get(id="undefined")
except User.DoesNotExist:
    print("DoesNotExist caught for 'undefined'!")
except ValueError:
    print("ValueError caught for 'undefined'")

try:
    User.objects.get(id="null")
except User.DoesNotExist:
    print("DoesNotExist caught for 'null'!")
except Exception as e:
    print("Exception", type(e))
