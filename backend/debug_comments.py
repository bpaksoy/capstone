import os
import django
import sys

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'collegetracker.settings')
django.setup()

from collegetracker.models import Post, Comment, User
from collegetracker.serializers import CommentSerializer
from django.test import RequestFactory

def test_comment_serialization():
    # Find a post without an author (Official)
    post = Post.objects.filter(author__isnull=True).first()
    if not post:
        print("No official post found, creating one...")
        post = Post.objects.create(title="Official Post", content="Official Content")
    
    # Get or create a comment for it
    comment = Comment.objects.filter(post=post).first()
    if not comment:
        comment = Comment.objects.create(post=post, content="Test comment on official post")
    
    print(f"Testing comment {comment.id} on post {post.id} (author: {post.author})")
    
    # Mock request
    factory = RequestFactory()
    request = factory.get('/')
    request.user = User.objects.first() # Any authenticated user
    
    try:
        serializer = CommentSerializer(comment, context={'request': request})
        data = serializer.data
        print("Serialization successful!")
        # print(data)
    except Exception as e:
        print(f"Serialization FAILED: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_comment_serialization()
