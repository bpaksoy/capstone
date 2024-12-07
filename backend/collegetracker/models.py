from django.db import models
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AbstractUser
from django.utils.functional import cached_property
from django.contrib.admin.models import LogEntry
from django.core.validators import FileExtensionValidator
from django.contrib.contenttypes.fields import GenericForeignKey, GenericRelation
from django.contrib.contenttypes.models import ContentType


# User = get_user_model()


class User(AbstractUser):
    image = models.ImageField('image', upload_to='user_images', blank=True, null=True,
                              validators=[FileExtensionValidator(['png', 'jpg', 'jpeg'])])
    city = models.CharField(max_length=100, blank=True, null=True)
    state = models.CharField(max_length=100, blank=True, null=True)
    country = models.CharField(max_length=100, blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    major = models.CharField(max_length=255, blank=True, null=True)
    education = models.CharField(max_length=255, blank=True, null=True)

    # Friendships - Many-to-many relationship, symmetrical (friend = mutual)
    friends = models.ManyToManyField(
        "self", symmetrical=True, blank=True, through='Friendship')

    # Following Colleges - Many-to-many relationship
    following_colleges = models.ManyToManyField('College', blank=True)


class Friendship(models.Model):
    user1 = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='friendship_user1')
    user2 = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='friendship_user2')
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=[('pending', 'Pending'), (
        'accepted', 'Accepted'), ('rejected', 'Rejected')], default='pending')

    class Meta:
        unique_together = ('user1', 'user2')

    def __str__(self):
        return f"{self.user1} - {self.user2} ({self.status})"


class College(models.Model):
    name = models.CharField(max_length=100)
    city = models.CharField(max_length=50)
    state = models.CharField(max_length=50)
    website = models.URLField(max_length=200)
    admission_rate = models.FloatField(null=True)
    sat_score = models.IntegerField(null=True)
    cost_of_attendance = models.IntegerField(null=True)
    tuition_in_state = models.IntegerField(null=True)
    tuition_out_state = models.IntegerField(null=True)

    def __str__(self):
        return self.name + ' - ' + self.city + ', ' + self.state + ', ' + self.website + ', ' + str(self.admission_rate) + ', ' + str(self.sat_score) + ', ' + str(self.cost_of_attendance) + ', ' + str(self.tuition_in_state) + ', ' + str(self.tuition_out_state)


class Post(models.Model):
    title = models.CharField(max_length=200)
    content = models.TextField()
    author = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    likes = GenericRelation('Like', related_query_name='posts')
    image = models.ImageField(upload_to='post_images/', blank=True, null=True,
                              validators=[FileExtensionValidator(['png', 'jpg', 'jpeg'])])

    # @cached_property
    # def author_username(self):
    #     return self.author.username

    def __str__(self):
        return f"{self.id}, {self.title}, {self.content}, {self.created_at}, {self.author}, {self.author.username}"

    class Meta:
        ordering = ['-created_at']


class Comment(models.Model):
    post = models.ForeignKey(
        Post, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    likes = GenericRelation('Like', related_query_name='comments')

    def __str__(self):
        return f"{self.author.username}: on {self.post.title} {self.content[:20]}..."

    class Meta:
        ordering = ['-created_at']


class Like(models.Model):
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='likes')
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey('content_type', 'object_id')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # Ensure a user can't like the same thing twice
        unique_together = ('user', 'content_type', 'object_id')

    def __str__(self):
        return f"{self.user.username} likes {self.content_object}"


class Reply(models.Model):
    comment = models.ForeignKey(
        Comment, on_delete=models.CASCADE, related_name='replies')
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.author.username} replied to {self.comment}"


class Bookmark(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    college = models.ForeignKey(College, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # Ensure one bookmark per user/college pair
        unique_together = ('user', 'college')
