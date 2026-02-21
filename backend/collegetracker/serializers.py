from rest_framework import serializers
from .models import College
from django.contrib.auth import authenticate
from .models import Comment, Post, Bookmark, Reply, User, Like, Friendship, SmartCollege, CollegeProgram, Article, Notification, ChatMessage
from django.contrib.contenttypes.models import ContentType
from rest_framework.validators import UniqueTogetherValidator


class CollegeSerializer(serializers.ModelSerializer):
    programs_count = serializers.SerializerMethodField()
    carnegie_classification_display = serializers.CharField(source='get_carnegie_classification_display', read_only=True)

    class Meta:
        model = College
        fields = '__all__'

    def get_programs_count(self, obj):
        return obj.programs.count()


class SmartCollegeSerializer(serializers.ModelSerializer):
    class Meta:
        model = SmartCollege
        fields = '__all__'


class CollegeProgramSerializer(serializers.ModelSerializer):
    class Meta:
        model = CollegeProgram
        fields = '__all__'


class UserSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(required=False, allow_null=True)
    friends = serializers.PrimaryKeyRelatedField(many=True, read_only=True)
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'first_name', 'last_name',
                  'city', 'state', 'country', 'major', 'education', 'gpa', 'sat_score', 
                  'bio', 'image', 'friends', 'is_private', 'role', 'associated_college', 'is_verified')

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        if not password:
            raise serializers.ValidationError("Password is required")
        user = User.objects.create(**validated_data)
        user.set_password(password)
        user.save()
        return user

    def update(self, instance, validated_data):
        if 'image' in validated_data:
            instance.image = validated_data['image']
        if 'password' in validated_data:
            password = validated_data.pop('password')
            instance.set_password(password)
        for attr, value in validated_data.items():
            if value is not None:
                setattr(instance, attr, value)
        instance.save()
        return instance


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()

    def validate(self, data):
        username = data.get('username')
        password = data.get('password')
        user = authenticate(username=username, password=password)
        if user is None:
            raise serializers.ValidationError("Invalid credentials")
        return {'user': user}


class UploadFileSerializer(serializers.Serializer):
    file = serializers.FileField()


class PostSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    comments_count = serializers.SerializerMethodField()
    likes_count = serializers.SerializerMethodField()
    image = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = Post
        fields = ('id', 'author', 'title', 'content', 'created_at',
                  'updated_at', 'comments_count', 'likes_count', 'image')
        depth = 1

    def get_comments_count(self, obj):
        return obj.comments.count()

    def get_likes_count(self, obj):
        return obj.likes.count()

    def create(self, validated_data):
        user = self.context['request'].user
        if 'image' in validated_data:
            image = validated_data.pop('image')
            post = Post.objects.create(author=user, **validated_data)
            post.image = image
            post.save()
            return post
        else:
            post = Post.objects.create(author=user, **validated_data)
            return post


class CommentSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    post = PostSerializer(read_only=True)
    replies_count = serializers.SerializerMethodField()
    likes_count = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ('id', 'post', 'author', 'content', 'created_at',
                  'updated_at', 'replies_count', 'likes_count')
        depth = 1

    def get_replies_count(self, obj):
        return obj.replies.count()

    def get_likes_count(self, obj):
        return obj.likes.count()


class CommentCountsSerializer(serializers.Serializer):
    comment_count = serializers.IntegerField()
    reply_count = serializers.IntegerField()


class ReplySerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    comment = CommentSerializer(read_only=True)

    class Meta:
        model = Reply
        fields = ['id', 'comment', 'author',
                  'content', 'created_at', 'updated_at']


class BookmarkSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bookmark
        fields = '__all__'


class LikeSerializer(serializers.Serializer):
    content_type = serializers.CharField()
    object_id = serializers.IntegerField()
    user = UserSerializer(read_only=True)

    class Meta:
        model = Like
        fields = ('id', 'user', 'content_object',
                  'content_type', 'object_id', 'created_at')


class FriendshipSerializer(serializers.ModelSerializer):
    user1 = UserSerializer(read_only=True)
    user2 = UserSerializer(read_only=True)

    class Meta:
        model = Friendship
        fields = '__all__'


class ArticleSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    likes_count = serializers.SerializerMethodField()
    type = serializers.CharField(read_only=True)

    class Meta:
        model = Article
        fields = ('id', 'author', 'title', 'slug', 'content', 'created_at', 'updated_at',
                  'published_date',  'image', 'likes_count', 'category', 'tags', 'featured', 'editor_byline', 'type')
        depth = 1

    def get_likes_count(self, obj):
        return obj.likes.count()


class NotificationSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    recipient = UserSerializer(read_only=True)

    class Meta:
        model = Notification
        fields = '__all__'


class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ('id', 'role', 'content', 'created_at')
