from django.db import models
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AbstractUser
from django.utils.functional import cached_property
from django.contrib.admin.models import LogEntry
from django.core.validators import FileExtensionValidator
from django.contrib.contenttypes.fields import GenericForeignKey, GenericRelation
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
from django.utils.text import slugify


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
    gpa = models.FloatField(blank=True, null=True)
    sat_score = models.IntegerField(blank=True, null=True)
    is_private = models.BooleanField(default=False)

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
    read = models.BooleanField(default=False)

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
    top_major = models.CharField(max_length=255, null=True, blank=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    ft_faculty_rate = models.FloatField(null=True, blank=True)
    enrollment_all = models.IntegerField(null=True, blank=True)
    UNITID = models.CharField(
        max_length=255, unique=True, null=True, blank=True)
    application_deadline = models.CharField(max_length=100, null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    image = models.ImageField(upload_to='college_images/', blank=True, null=True)
    
    # --- New Metadata from Scorecard ---
    locale = models.IntegerField(null=True, blank=True) # 11-13 City, 21-23 Suburb, etc.
    control = models.IntegerField(null=True, blank=True) # 1=Public, 2=Priv NP, 3=Priv FP
    hbcu = models.BooleanField(default=False)
    hsi = models.BooleanField(default=False)
    men_only = models.BooleanField(default=False)
    women_only = models.BooleanField(default=False)
    relaffil = models.IntegerField(null=True, blank=True) # Code for affiliation
    
    # --- Performance & Financials ---
    avg_net_price = models.IntegerField(null=True, blank=True)
    grad_rate = models.FloatField(null=True, blank=True)
    retention_rate = models.FloatField(null=True, blank=True)
    student_faculty_ratio = models.IntegerField(null=True, blank=True)
    loan_rate = models.FloatField(null=True, blank=True)

    # --- New Metadata from IPEDS ---
    carnegie_classification = models.IntegerField(null=True, blank=True)
    is_open_admission = models.BooleanField(default=False)
    is_distance_education = models.BooleanField(default=False)

    def get_carnegie_classification_display(self):
        labels = {
            -2: "Not classified",
            1: "Mixed Associate Large",
            2: "Mixed Associate Medium",
            3: "Mixed Associate Small",
            4: "Mixed Associate/Baccalaureate",
            5: "Mixed Baccalaureate",
            6: "Mixed Undergraduate/Graduate-Doctorate Large",
            7: "Mixed Undergraduate/Graduate-Doctorate Medium",
            8: "Mixed Undergraduate/Graduate-Doctorate Small",
            9: "Mixed Undergraduate/Graduate-Master's Large/Medium",
            10: "Mixed Undergraduate/Graduate-Master's Small",
            11: "Professions-focused Associate Large/Medium",
            12: "Professions-focused Associate Small",
            13: "Professions-focused Associate/Baccalaureate",
            14: "Professions-focused Baccalaureate Medium",
            15: "Professions-focused Baccalaureate Small",
            16: "Professions-focused Undergraduate/Graduate-Doctorate Large",
            17: "Professions-focused Undergraduate/Graduate-Doctorate Medium",
            18: "Professions-focused Undergraduate/Graduate-Doctorate Small",
            19: "Professions-focused Undergraduate/Graduate-Master's Large/Medium",
            20: "Professions-focused Undergraduate/Graduate-Master's Small",
            21: "Special Focus: Applied and Career Studies",
            22: "Special Focus: Arts and Sciences",
            23: "Special Focus: Arts, Music, and Design",
            24: "Special Focus: Business",
            25: "Special Focus: Graduate Studies",
            26: "Special Focus: Law",
            27: "Special Focus: Medical Schools and Centers",
            28: "Special Focus: Nursing",
            29: "Special Focus: Other Health Professions",
            30: "Special Focus: Technology, Engineering, and Sciences",
            31: "Special Focus: Theological Studies",
        }
        return labels.get(self.carnegie_classification, "Unknown")

    def __str__(self):
        return self.name + ' - ' + self.city + ', ' + self.state + ', ' + self.website + ', ' + str(self.admission_rate) + ', ' + str(self.sat_score) + ', ' + str(self.cost_of_attendance) + ', ' + str(self.tuition_in_state) + ', ' + str(self.tuition_out_state) + ', ' + str(self.latitude) + ', ' + str(self.longitude) + ', ' + str(self.ft_faculty_rate)


class SmartCollege(models.Model):
    name = models.CharField(max_length=255)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=2)
    website = models.CharField(max_length=200, null=True, blank=True)
    admission_rate = models.FloatField(null=True, blank=True)
    sat_score = models.IntegerField(null=True, blank=True)
    cost_of_attendance = models.IntegerField(null=True, blank=True)
    tuition_in_state = models.IntegerField(null=True, blank=True)
    tuition_out_state = models.IntegerField(null=True, blank=True)
    top_major = models.CharField(max_length=255, null=True, blank=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    ft_faculty_rate = models.FloatField(null=True, blank=True)
    enrollment_all = models.IntegerField(null=True, blank=True)
    grad_rate = models.FloatField(null=True, blank=True)
    retention_rate = models.FloatField(null=True, blank=True)
    student_faculty_ratio = models.IntegerField(null=True, blank=True)
    avg_net_price = models.IntegerField(null=True, blank=True)
    CCBASIC = models.CharField(max_length=255, null=True, blank=True)
    HLOFFER = models.CharField(max_length=255, null=True, blank=True)

    def __str__(self):
        return self.name


class CollegeProgram(models.Model):
    college = models.ForeignKey(
        College, on_delete=models.CASCADE, related_name='programs')
    cipcode = models.CharField(max_length=20)
    cipdesc = models.TextField()
    creddesc = models.CharField(max_length=255, null=True, blank=True)
    UNITID = models.CharField(max_length=255, null=True, blank=True)

    def __str__(self):
        return f"{self.college.name} - {self.cipdesc}"


class Article(models.Model):
    author = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='articles')
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=255, unique=True, blank=True)
    content = models.TextField()
    published_date = models.DateTimeField(
        blank=True, null=True)  # Optional publication date
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    image = models.ImageField(
        upload_to='article_images/', blank=True, null=True)
    category = models.CharField(
        max_length=100, blank=True)  # example of category
    # tags as comma separated string
    tags = models.CharField(max_length=200, blank=True)
    # flag to mark the article as featured
    featured = models.BooleanField(default=False)
    # editors byline if applicable
    editor_byline = models.CharField(max_length=250, blank=True)
    # generic relation to Like model
    likes = GenericRelation('Like', related_query_name='articles')
    type = models.CharField(max_length=20, default='article')

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super(Article, self).save(*args, **kwargs)

    class Meta:
        # order by publish date first then created date.
        ordering = ['-published_date', '-created_at']


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


class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ('like', 'Like'),
        ('comment', 'Comment'),
        ('friend_request', 'Friend Request'),
        ('accepted_request', 'Accepted Request'),
    ]

    recipient = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='notifications')
    sender = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='sent_notifications')
    notification_type = models.CharField(
        max_length=20, choices=NOTIFICATION_TYPES)

    # Generic relation to the object causing the notification (Post, Comment, etc.)
    content_type = models.ForeignKey(
        ContentType, on_delete=models.CASCADE, null=True, blank=True)
    object_id = models.PositiveIntegerField(null=True, blank=True)
    content_object = GenericForeignKey('content_type', 'object_id')

    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.sender.username} {self.notification_type} to {self.recipient.username}"
