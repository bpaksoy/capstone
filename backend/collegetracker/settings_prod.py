"""
Production settings for CollegeTracker on GCP Cloud Run.
Imports base settings and overrides for production.
"""
import os
from collegetracker.settings import *  # noqa

# =====================================================
# SECURITY
# =====================================================
DEBUG = False
SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', SECRET_KEY)

# Cloud Run provides the service URL - add it here
ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', '*').split(',')

# HTTPS settings (Cloud Run handles TLS termination)
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_SSL_REDIRECT = False  # Cloud Run handles this
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

# =====================================================
# CORS - Allow frontend origins
# =====================================================
CORS_ALLOWED_ORIGINS = [
    origin.strip() for origin in
    os.environ.get('CORS_ALLOWED_ORIGINS', 'http://localhost:3000').split(',')
]

CSRF_TRUSTED_ORIGINS = [
    origin.strip() for origin in
    os.environ.get('CSRF_TRUSTED_ORIGINS', 'http://localhost:3000').split(',')
]

CORS_ALLOW_CREDENTIALS = True

# =====================================================
# DATABASE — Cloud SQL PostgreSQL
# =====================================================
if os.environ.get('DB_NAME'):
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.environ.get('DB_NAME', 'collegetracker'),
            'USER': os.environ.get('DB_USER', 'postgres'),
            'PASSWORD': os.environ.get('DB_PASSWORD', ''),
            'HOST': os.environ.get('DB_HOST', '/cloudsql/' + os.environ.get('CLOUD_SQL_CONNECTION', '')),
            'PORT': os.environ.get('DB_PORT', '5432'),
        }
    }
# else: fall back to SQLite from base settings (dev/demo mode)

# =====================================================
# STATIC & MEDIA FILES (Django 5.1 STORAGES)
# =====================================================
MIDDLEWARE.insert(
    MIDDLEWARE.index('django.middleware.security.SecurityMiddleware') + 1,
    'whitenoise.middleware.WhiteNoiseMiddleware'
)

STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
GCS_BUCKET = os.environ.get('GCS_BUCKET_NAME')

if GCS_BUCKET:
    GS_BUCKET_NAME = GCS_BUCKET
    GS_DEFAULT_ACL = 'publicRead'
    MEDIA_URL = f'https://storage.googleapis.com/{GCS_BUCKET}/'
    
    STORAGES = {
        "default": {
            "BACKEND": "storages.backends.gcloud.GoogleCloudStorage",
        },
        "staticfiles": {
            "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
        },
    }
else:
    MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
    MEDIA_URL = '/media/'
    STORAGES = {
        "default": {
            "BACKEND": "django.core.files.storage.FileSystemStorage",
        },
        "staticfiles": {
            "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
        },
    }

# =====================================================
# LOGGING
# =====================================================
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}
