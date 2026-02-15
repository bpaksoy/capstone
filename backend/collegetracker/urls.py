"""
URL configuration for collegetracker project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from collegetracker import views
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView, TokenVerifyView
from graphene_django.views import GraphQLView
from django.views.decorators.csrf import csrf_exempt
from .views import UploadApiView
from .views import RegisterView, LoginView, CollegeListView, CommentListView, CommentDetailView, PostDetailView, CurrentUserView, PostListView, BookmarkToggleView, BookmarkedCollegesView, ReplyCreateView, ReplyListView, CommentCountView, PostCommentCountsView, UserUpdateView, UserCommentsView, UserPostsView
from django.conf.urls.static import static
from django.conf import settings

urlpatterns = [
    path("api/user/", CurrentUserView.as_view(), name="user"),
    path("api/user/update/", UserUpdateView.as_view(), name="user-update"),
    path('api/users/<int:user_id>/',
         views.UserDetailView.as_view(), name='user-detail'),
    path('api/users/pending-requests/',
         views.PendingFriendRequestsView.as_view(), name='pending-friend-requests'),
    path('api/users/<int:friend_id>/friend-request/',
         views.FriendRequestCreateView.as_view(), name='friend-request-create'),
    path('api/users/<int:friend_id>/friend-request/',
         views.FriendRequestDeleteView.as_view(), name='friend-request-delete'),
    path('api/users/friend-request/<str:action>/',
         views.FriendRequestRespondView.as_view(), name='friend-request-respond'),
    path('api/friend-requests/<int:request_id>/read/',
         views.FriendRequestReadView.as_view(), name='friend-request-read'),
    path('api/users/<int:friend_id>/unfriend/',
         views.UnfriendView.as_view(), name='unfriend'),
    path('api/users/<int:user_id>/friends/',
         views.FriendsView.as_view(), name='friends'),
    path('api/friend-request-count/',
         views.FriendRequestCountView.as_view(), name='friend-request-count'),
    path('api/friend-requests/', views.FriendRequestsView.as_view(),
         name='friend-requests'),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    path('admin/', admin.site.urls),
    path('api/colleges/scroll/', views.colleges, name='colleges'),
    path('api/colleges/<int:id>/', views.college, name='college'),
    path('api/colleges/', CollegeListView.as_view()),
    path('api/colleges/<int:college_id>/', views.CollegeDetailView.as_view()),
    path('api/colleges/featured/', views.FeaturedCollegesView.as_view(), name='featured-colleges'),
    path('api/colleges/filtered/', views.FilteredCollegeListView.as_view(),
         name='filtered-college-list'),
    path('api/smart-colleges/filtered/', views.FilteredSmartCollegeListView.as_view(),
         name='filtered-smart-college-list'),
    path('api/smart-colleges/<int:college_id>/',
         views.SmartCollegeDetailView.as_view(), name="smart-college-detail"),
    path('api/colleges/<int:college_id>/programs/',
         views.CollegeProgramListView.as_view(), name='college-programs'),
    path('api/colleges/programs/',
         views.ProgramSearchListView.as_view(), name='program-search'),
    path('api/colleges/<int:college_pk>/bookmark/',
         BookmarkToggleView.as_view(), name='bookmark-toggle'),
    path('api/bookmarks/', BookmarkedCollegesView.as_view(), name='user-bookmarks'),
    path('api/register/', RegisterView.as_view(), name='register'),
    path('api/login/', LoginView.as_view(), name='login'),
    path('api/search/<str:name>/', views.search, name='search'),
    path('api/colleges/detailed/', views.DetailedSearchListView.as_view(),
         name="detailed-college-search"),
    path('api/posts/<int:post_pk>/comments/', CommentListView.as_view()),
    path('api/comments/<int:pk>/', CommentDetailView.as_view()),
    path('api/comments/<int:pk>/edit/',
         views.EditCommentView.as_view(), name='edit-comment'),
    path('api/comments/<int:pk>/delete/',
         views.DeleteCommentView.as_view(), name='delete-comment'),
    path('api/users/<int:user_id>/comments/',
         UserCommentsView.as_view(), name='user-comments'),
    path('api/users/<int:user_id>/posts/',
         UserPostsView.as_view(), name='user-posts'),
    path('api/comments/<int:pk>/replies/',
         ReplyListView.as_view(), name='reply-list'),
    path('api/comments/<int:pk>/replies/create/',
         ReplyCreateView.as_view(), name='reply-create'),
    path('api/comment_counts/', CommentCountView.as_view(), name='comment-counts'),
    path('api/posts/<int:pk>/comment_counts/',
         PostCommentCountsView.as_view(), name='post-comment-counts'),
    path('api/posts/', PostListView.as_view()),
    path('api/posts/<int:pk>/', views.PostDetailView.as_view(), name='post-detail'),
    path('api/posts/<int:pk>/edit/',
         views.EditPostView.as_view(), name='edit-post'),
    path('api/posts/<int:pk>/delete/',
         views.DeletePostView.as_view(), name='delete-post'),
    path('api/news/', views.NewsFeedView.as_view(), name='news-feed'),
    path('api/news-api/', views.NewsAPIView.as_view(), name='news-api-feed'),
    path('api/articles/', views.ArticleListView.as_view(),
         name='article-list-create'),
    path('api/articles/<slug:slug>/',
         views.ArticleDetailView.as_view(), name='article-detail'),
    path('api/articles/<slug:slug>/edit/',
         views.EditArticleView.as_view(), name='article-edit'),
    path('api/articles/<slug:slug>/delete/',
         views.DeleteArticleView.as_view(), name='article-delete'),
    path('api/likes/', views.LikeListView.as_view(), name='like-list'),
    path('api/likes/create/', views.LikeCreateView.as_view(), name='like-create'),
    path('api/likes/<int:like_id>/',
         views.LikeDeleteView.as_view(), name='like-delete'),
    #     path('graphql/', csrf_exempt(GraphQLView.as_view(graphiql=True))),
    path('upload/', UploadApiView.as_view(), name='upload_file'),
    path('upload2/', views.UploadApiView2.as_view(), name='upload_file2'),
    path('upload4/', views.UploadApiView4.as_view(), name='upload_file4'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
