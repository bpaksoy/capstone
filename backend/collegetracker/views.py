import re
from goose3 import Goose
from .models import User, College, Comment, Post, Bookmark, Reply, Like, Friendship, SmartCollege, CollegeProgram
from django.http import JsonResponse, Http404
from django.db import IntegrityError
from .serializers import CollegeSerializer, UserSerializer, UploadFileSerializer, LoginSerializer, CommentSerializer, PostSerializer, BookmarkSerializer, ReplySerializer, LikeSerializer, FriendshipSerializer, SmartCollegeSerializer, CollegeProgramSerializer
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status, generics, serializers
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework_simplejwt.tokens import RefreshToken
import pandas as pd
from django.shortcuts import render, redirect,  get_object_or_404
from django.contrib import messages
from .forms import UploadFileForm
from datetime import datetime
# from django.contrib.auth.models import User
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import AccessToken
from django.core.exceptions import ObjectDoesNotExist, ValidationError
from django.db.models import Count, Sum
from rest_framework.parsers import MultiPartParser, FormParser
from django.contrib.contenttypes.models import ContentType
from django.db.models import Q
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
import chardet
from io import StringIO
import feedparser
import requests
import os
from bs4 import BeautifulSoup
from newspaper import Article
from dotenv import load_dotenv
from django.conf import settings
from datetime import datetime, timedelta
load_dotenv()

api_view(['GET', 'POST'])


class RegisterView(APIView):
    def post(self, request):
        # print("request is here", request.body)
        # print("request data", request.data)
        if User.objects.filter(email=request.data['email']).exists():
            return Response({'error': 'Email already registered'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            tokens = {
                'refresh': str(refresh),
                'access': str(refresh.access_token)
            }
            return Response(tokens, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    serializer_class = LoginSerializer

    def post(self, request):
        serializer = self.serializer_class(
            data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']

        refresh = RefreshToken.for_user(user)
        tokens = {
            'refresh': str(refresh),
            'access': str(refresh.access_token)
        }

        return Response(tokens, status=status.HTTP_201_CREATED)


class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def post(self, request):
        user = self.request.user

        refresh = RefreshToken.for_user(user)
        tokens = {
            'refresh': str(refresh),
            'access': str(refresh.access_token)
        }

        return self.request.user


class UserDetailView(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request, user_id, format=None):
        try:
            user = get_object_or_404(User, pk=user_id)
            serializer = UserSerializer(user)
            return Response(serializer.data)
        except Http404:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UserUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, format=None):
        user = self.request.user
        # partial=True allows updating only some fields
        serializer = UserSerializer(user, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, format=None):
        user = self.request.user
        # partial=True allows updating only some fields
        serializer = UserSerializer(user, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, format=None):  # Use PATCH for partial updates
        user = self.request.user
        serializer = UserSerializer(
            user, data=request.data, partial=True)  # partial=True is key

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


api_view(['GET', 'POST'])


@permission_classes([IsAuthenticatedOrReadOnly])
def colleges(request):
    data = College.objects.all()
    serializer = CollegeSerializer(data, many=True)
    return JsonResponse({"colleges": serializer.data})


class FeaturedCollegesView(generics.ListAPIView):
    serializer_class = CollegeSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        return College.objects.filter(
            state__in=['MA', 'NY', 'CA'],
            admission_rate__isnull=False,
            admission_rate__gt=0.0
        ).order_by('admission_rate')[:9]


class CollegeListView(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request, format=None):
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 10))

        # Order the queryset!  Choose an appropriate field for ordering.
        paginator = Paginator(College.objects.all().order_by('id'), page_size)

        try:
            colleges = paginator.page(page)
        except PageNotAnInteger:
            colleges = paginator.page(1)
        except EmptyPage:
            colleges = paginator.page(paginator.num_pages)

        serializer = CollegeSerializer(colleges, many=True)
        return Response({
            'colleges': serializer.data,
            'has_more': colleges.has_next()
        })


class CollegeDetailView(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request, college_id, format=None):
        try:
            college = College.objects.get(pk=college_id)
        except College.DoesNotExist:
            raise Http404("College not found")

        serializer = CollegeSerializer(college)
        return Response(serializer.data)


class SmartCollegeDetailView(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request, college_id, format=None):
        try:
            college = SmartCollege.objects.get(pk=college_id)
        except SmartCollege.DoesNotExist:
            raise Http404("College not found")

        serializer = SmartCollegeSerializer(college)
        return Response(serializer.data)


class FilteredCollegeListView(generics.ListAPIView):
    serializer_class = CollegeSerializer

    def get_queryset(self):
        states_param = self.request.query_params.get('states', None)
        if not states_param:
            raise ValidationError("The 'states' query parameter is required.")
        states_list = [state.strip() for state in states_param.split(',')]
        queryset = College.objects.filter(state__in=states_list)
        return queryset


class FilteredSmartCollegeListView(generics.ListAPIView):
    serializer_class = SmartCollegeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        states_param = self.request.query_params.get('states', None)
        if not states_param:
            raise ValidationError("The 'states' query parameter is required.")
        states_list = [state.strip() for state in states_param.split(',')]
        queryset = SmartCollege.objects.filter(state__in=states_list)
        return queryset

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        # print(serializer.data)
        return Response({'colleges': serializer.data})


class CollegeProgramListView(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request, college_id):
        try:
            college = College.objects.get(pk=college_id)
        except College.DoesNotExist:
            return Response({'error': 'College not found'}, status=status.HTTP_404_NOT_FOUND)
        search_query = request.query_params.get('search', '')
        programs = college.programs.filter(cipdesc__icontains=search_query)
        serializer = CollegeProgramSerializer(programs, many=True)
        return Response({'programs': serializer.data}, status=status.HTTP_200_OK)


# class ProgramSearchListView(generics.ListAPIView):
#     serializer_class = CollegeSerializer
#     permission_classes = [IsAuthenticated]

#     def get_queryset(self):
#         search_query = self.request.query_params.get('search', '')
#         if not search_query:
#             raise ValidationError("The 'search' query parameter is required.")
#         queryset = College.objects.filter(
#             programs__cipdesc__icontains=search_query
#         ).distinct()
#         return queryset


class ProgramSearchListView(generics.ListAPIView):
    serializer_class = CollegeSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        search_query = self.request.query_params.get('search', '')
        if not search_query:
            raise ValidationError("The 'search' query parameter is required.")

        page = int(self.request.query_params.get('page', 1))
        page_size = int(self.request.query_params.get('page_size', 10))

        queryset = College.objects.filter(
            programs__cipdesc__icontains=search_query
        ).distinct()

        paginator = Paginator(queryset, page_size)
        try:
            colleges = paginator.page(page)
        except PageNotAnInteger:
            colleges = paginator.page(1)
        except EmptyPage:
            colleges = paginator.page(paginator.num_pages)

        return colleges

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'colleges': serializer.data,
            'has_more': queryset.has_next()
        })


class DetailedSearchListView(generics.ListAPIView):
    serializer_class = CollegeSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = College.objects.all()
        state_param = self.request.query_params.get('state', None)
        city_param = self.request.query_params.get('city', None)
        program_param = self.request.query_params.get('program', None)
        min_sat_param = self.request.query_params.get('min_sat', None)
        max_sat_param = self.request.query_params.get('max_sat', None)
        name_param = self.request.query_params.get('name', None)
        page = int(self.request.query_params.get('page', 1))
        page_size = int(self.request.query_params.get('page_size', 10))

        if state_param:
            queryset = queryset.filter(state__iexact=state_param)

        if city_param:
            queryset = queryset.filter(city__iexact=city_param)
        if name_param:
            queryset = queryset.filter(name__icontains=name_param)

        if program_param:
            queryset = queryset.filter(
                programs__cipdesc__icontains=program_param).distinct()
        if min_sat_param:
            try:
                min_sat = int(min_sat_param)
                queryset = queryset.filter(sat_score__gte=min_sat)
            except ValueError:
                pass
        if max_sat_param:
            try:
                max_sat = int(max_sat_param)
                queryset = queryset.filter(sat_score__lte=max_sat)
            except ValueError:
                pass
        paginator = Paginator(queryset, page_size)
        try:
            colleges = paginator.page(page)
        except PageNotAnInteger:
            colleges = paginator.page(1)
        except EmptyPage:
            colleges = paginator.page(paginator.num_pages)
        return colleges

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'colleges': serializer.data,
            'has_more': queryset.has_next()
        })


api_view(['GET', 'POST'])


@permission_classes([IsAuthenticated])
def college(request, id):
    try:
        data = College.objects.get(pk=id)
    except College.DoesNotExist:
        raise Http404("College does not exist")
    serializer = CollegeSerializer(data)
    return JsonResponse({"college": serializer.data})


api_view(['GET', 'POST'])


@permission_classes([IsAuthenticatedOrReadOnly])
def search(request, name):
    try:
        data = College.objects.filter(name__contains=name)
    except College.DoesNotExist:
        raise Http404("College does not exist")
    serializer = CollegeSerializer(data, many=True)
    return JsonResponse({"college": serializer.data})


@api_view(['POST'])
def register(request):
    serializer = UserSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        tokens = {
            'refresh': str(refresh),
            'access': str(refresh.access_token)
        }
        return Response(tokens, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UploadApiView(APIView):
    serializer_class = UploadFileSerializer
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        print(request)
        try:
            data = request.FILES['file']
            # if not serializer.is_valid():
            #     return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            df = pd.read_csv(data, sep=',', on_bad_lines="skip",
                             index_col=False, na_values=None, na_filter=True, dtype='unicode').convert_dtypes()
            print("df is here", df)

            colleges = list()
            for index, row in df.iterrows():
                # enrollment_all = int(row['UG']) if pd.notna(
                #     row['UG']) and not pd.isna(row['UG']) else print("row", row)

                college, created = College.objects.get_or_create(
                    name=row['INSTNM'],
                    city=row['CITY'],
                    state=row['STABBR'],
                    website=row['INSTURL'],
                    admission_rate=row['ADM_RATE'],
                    sat_score=row['SAT_AVG'],
                    cost_of_attendance=row['COSTT4_A'],
                    tuition_in_state=row['TUITIONFEE_IN'],
                    tuition_out_state=row['TUITIONFEE_OUT'],
                    latitude=row['LATITUDE'],
                    longitude=row['LONGITUDE'],
                    ft_faculty_rate=row['PFTFAC'],
                    enrollment_all=row['UGDS'],
                    UNITID=row['UNITID']
                )

                if created:
                    colleges.append(college)
                    messages.success(
                        request, f'Successfully imported {college.name}')
                else:
                    messages.warning(request, f'{college.name} already exists')
            College.objects.bulk_create(colleges)
            return Response({'message': 'File uploaded successfully'}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class UploadApiView2(APIView):
    serializer_class = UploadFileSerializer
    parser_classes = [MultiPartParser, FormParser]
    # permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            data = request.FILES['file']
            raw_data = data.read()
            encoding = chardet.detect(raw_data)['encoding']
            if not encoding:
                raise Exception("Could not detect the encoding of the file")
            decoded_data = raw_data.decode(encoding, 'replace')
            df = pd.read_csv(StringIO(decoded_data),  sep=',', on_bad_lines='skip', index_col=False,
                             na_values=None, na_filter=True, dtype='unicode').convert_dtypes()

            colleges = []
            for index, row in df.iterrows():
                try:
                    unit_id = row['UNITID']
                    college = College.objects.filter(
                        Q(UNITID=unit_id)
                    ).first()

                    if college and all([college.admission_rate, college.sat_score, college.cost_of_attendance, college.tuition_in_state,
                                        college.tuition_out_state, college.latitude, college.longitude,
                                        college.ft_faculty_rate, college.enrollment_all,
                                        row.get('HLOFFER'), row.get('CCBASIC')]):
                        admission_rate = college.admission_rate
                        sat_score = college.sat_score
                        website = college.website
                        cost_of_attendance = college.cost_of_attendance
                        tuition_in_state = college.tuition_in_state
                        tuition_out_state = college.tuition_out_state
                        latitude = college.latitude
                        longitude = college.longitude
                        enrollment_all = college.enrollment_all
                        ft_faculty_rate = college.ft_faculty_rate
                        hloffers = str(row.get('HLOFFER')) if pd.notna(
                            row.get('HLOFFER')) else None
                        ccbasic = str(row.get('CCBASIC')) if pd.notna(
                            row.get('CCBASIC')) else None
                        smart_college, created = SmartCollege.objects.update_or_create(
                            name=row['INSTNM'],
                            defaults={
                                'city': row['CITY'],
                                'state': row['STABBR'],
                                'website': website,
                                'admission_rate': admission_rate,
                                'sat_score': sat_score,
                                'cost_of_attendance': cost_of_attendance,
                                'tuition_in_state': tuition_in_state,
                                'tuition_out_state': tuition_out_state,
                                'latitude': latitude,
                                'longitude': longitude,
                                'enrollment_all': enrollment_all,
                                'ft_faculty_rate': ft_faculty_rate,
                                'HLOFFER': hloffers,
                                'CCBASIC': ccbasic,
                            }
                        )

                        if created:
                            messages.success(
                                request, f'Successfully imported {smart_college.name}')
                        else:
                            messages.warning(
                                request, f'{smart_college.name} updated')
                except (ValueError, KeyError) as e:
                    messages.error(
                        request, f"Error processing row {index+1}: {e}")
            return Response({'message': 'File uploaded successfully'}, status=status.HTTP_201_CREATED)
        except Exception as e:
            messages.error(request, f"An unexpected error occurred: {e}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class UploadApiView3(APIView):
    serializer_class = UploadFileSerializer
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            data = request.FILES['file']
            df = pd.read_csv(data, sep=',', on_bad_lines='skip', index_col=False,
                             na_values=None, na_filter=True, dtype='unicode', encoding='latin1').convert_dtypes()

            colleges = []
            for index, row in df.iterrows():
                try:
                    unit_id = row['UNITID'] if pd.notna(
                        row['UNITID']) else None
                    enrollment_all = int(row['UG']) if pd.notna(
                        row['UG']) and not pd.isna(row['UG']) else None
                    college, created = College.objects.update_or_create(
                        name=row['INSTNM'],
                        defaults={
                            'city': row['CITY'],
                            'state': row['STABBR'],
                            'website': row['INSTURL'],
                            'admission_rate': row['ADM_RATE'],
                            'sat_score': row['SAT_AVG'],
                            'cost_of_attendance': row['COSTT4_A'],
                            'tuition_in_state': row['TUITIONFEE_IN'],
                            'tuition_out_state': row['TUITIONFEE_OUT'],
                            'latitude': row['LATITUDE'],
                            'longitude': row['LONGITUDE'],
                            'ft_faculty_rate': row['PFTFAC'],
                            'UNITID': unit_id,
                            'enrollment_all': enrollment_all,
                        }
                    )
                    if created:
                        messages.success(
                            request, f'Successfully imported {college.name}')
                    else:
                        messages.warning(request, f'{college.name} updated')
                except (ValueError, KeyError) as e:
                    messages.error(
                        request, f"Error processing row {index+1}: {e}")
            return Response({'message': 'File uploaded successfully'}, status=status.HTTP_201_CREATED)
        except Exception as e:
            messages.error(request, f"An unexpected error occurred: {e}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class UploadApiView4(APIView):
    serializer_class = UploadFileSerializer
    parser_classes = [MultiPartParser, FormParser]
    # permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            data = request.FILES['file']
            df = pd.read_csv(data, sep=',', on_bad_lines='skip', index_col=False,
                             na_values=None, na_filter=True, dtype='unicode', encoding='latin1').convert_dtypes()
            programs = []
            for index, row in df.iterrows():
                try:
                    unit_id = row['UNITID'] if pd.notna(
                        row['UNITID']) else None
                    college = College.objects.filter(Q(UNITID=unit_id)).first()
                    if college:
                        college_program, created = CollegeProgram.objects.get_or_create(
                            college=college,
                            cipcode=row['CIPCODE'],
                            defaults={
                                'cipdesc': row['CIPDESC'],
                                'UNITID': unit_id,
                                'creddesc': row['CREDDESC'],
                            }
                        )
                        if created:
                            print("college_program", college_program)
                            messages.success(
                                request, f'Successfully imported {college_program.cipdesc}')
                        else:
                            messages.warning(
                                request, f'{college_program.cipdesc} updated')
                except (ValueError, KeyError) as e:
                    messages.error(
                        request, f'Error processing row {index+1}: {e}')
            return Response({'message': 'File uploaded successfully'}, status=status.HTTP_201_CREATED)
        except Exception as e:
            messages.error(request, f"An unexpected error occurred: {e}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class LikeListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, format=None):
        content_type_param = request.GET.get('content_type')
        object_id_param = request.GET.get('object_id')
        user_id_param = request.user.id

        if not all([content_type_param, object_id_param, user_id_param]):
            return Response({'error': 'Missing content_type, object_id, or user parameters'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            object_id = int(object_id_param)
        except ValueError:
            return Response({'error': 'Invalid object_id (must be an integer)'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            content_type = ContentType.objects.get(model=content_type_param)
            like = Like.objects.filter(
                content_type=content_type,
                object_id=object_id,
                user_id=user_id_param,
            ).first()

            if like:
                return Response({'count': Like.objects.filter(content_type=content_type, object_id=object_id).count(), 'is_liked': True, 'like_id': like.id})
            else:
                return Response({'count': Like.objects.filter(content_type=content_type, object_id=object_id).count(), 'is_liked': False, 'like_id': None})

        except ContentType.DoesNotExist:
            return Response({'error': f'Invalid content type: {content_type_param}'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': f'An unexpected error occurred: {e}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class LikeCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, format=None):
        try:
            content_type_str = request.data.get('content_type')
            object_id_str = request.data.get('object_id')

            if not content_type_str or not object_id_str:
                return Response({'error': 'content_type and object_id are required'}, status=status.HTTP_400_BAD_REQUEST)

            content_type = ContentType.objects.get(model=content_type_str)
            object_id = int(object_id_str)

            Like.objects.create(user=request.user,
                                content_type=content_type, object_id=object_id)
            return Response({'message': 'Like created successfully'}, status=status.HTTP_201_CREATED)

        except ContentType.DoesNotExist:
            return Response({'error': f"Invalid content type: {content_type_str}"}, status=status.HTTP_400_BAD_REQUEST)
        except ValueError:
            return Response({'error': f"Invalid object_id: {object_id_str}"}, status=status.HTTP_400_BAD_REQUEST)
        except IntegrityError:
            return Response({'error': 'User already liked this item'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': f'Server Error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class LikeDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, like_id, format=None):
        like = get_object_or_404(Like, pk=like_id)
        if like.user == request.user:
            like.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response({"error": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def post_list(request):
    if request.method == 'GET':
        posts = Post.objects.all()
        serializer = PostSerializer(posts, many=True)
        return Response(serializer)
    elif request.method == 'POST':
        print("request.data!!!", request.data)
        serializer = PostSerializer(data=request.data)
        if serializer.is_valid():
            # Assign the current user as author
            serializer.save(author=request.user)
            print("serializer.data", serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def post_detail(request, pk):
    try:
        post = Post.objects.get(pk=pk)
    except Post.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = PostSerializer(post)
        return Response(serializer.data)
    elif request.method == 'PUT':
        if post.author != request.user:
            return Response({'error': 'You cannot edit this post'}, status=status.HTTP_403_FORBIDDEN)
        serializer = PostSerializer(post, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    elif request.method == 'DELETE':
        if post.author != request.user:
            return Response({'error': 'You cannot delete this post'}, status=status.HTTP_403_FORBIDDEN)
        post.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class PostListView(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        posts = Post.objects.all()
        serializer = PostSerializer(posts, many=True)
        # print("posts:", serializer.data)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, format=None):
        try:
            # print("request.data", request.data)
            serializer = PostSerializer(
                data=request.data, context={'request': request})
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except ValidationError as e:
            return Response({'error': e.detail}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class EditPostView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, pk, format=None):
        post = get_object_or_404(Post, pk=pk)
        if post.author != request.user:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)
        serializer = PostSerializer(post, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DeletePostView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk, format=None):
        post = get_object_or_404(Post, pk=pk)
        if post.author != request.user:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)
        post.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class PostDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk, format=None):
        try:
            post = get_object_or_404(Post, pk=pk)
            serializer = PostSerializer(post)
            return Response(serializer.data)
        except Http404:
            return Response({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UserPostsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id, format=None):
        posts = Post.objects.filter(author_id=user_id)
        serializer = PostSerializer(posts, many=True)
        return Response(serializer.data)


class CommentListView(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request, post_pk):
        """
        Get comments for a specific post.
        """
        try:
            post = Post.objects.get(pk=post_pk)
        except Post.DoesNotExist:
            return Response({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)
        comments = post.comments.all()
        serializer = CommentSerializer(comments, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, post_pk):
        try:
            post = Post.objects.get(pk=post_pk)
        except Post.DoesNotExist:
            return Response({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)
        serializer = CommentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(author=request.user, post=post)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EditCommentView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, pk, format=None):
        comment = get_object_or_404(Comment, pk=pk)
        if comment.author != request.user:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)
        serializer = CommentSerializer(
            comment, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DeleteCommentView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk, format=None):
        comment = get_object_or_404(Comment, pk=pk)
        if comment.author != request.user:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)
        comment.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class CommentDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        try:
            return Comment.objects.get(pk=pk)
        except Comment.DoesNotExist:
            return None

    def get(self, request, pk):
        comment = self.get_object(pk)
        if comment is None:
            return Response({'error': 'Comment not found'}, status=status.HTTP_404_NOT_FOUND)
        serializer = CommentSerializer(comment)
        return Response(serializer.data, status=status.HTTP_200_OK)


class UserCommentsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id, format=None):
        comments = Comment.objects.filter(author_id=user_id)
        serializer = CommentSerializer(comments, many=True)
        return Response(serializer.data)


def get_comment_and_reply_counts():
    result = Comment.objects.aggregate(
        comment_count=Count('id'),
        reply_count=Count('replies')
    )
    print("result", result)
    return result


class CommentCountView(APIView):
    def get(self, request):
        counts = get_comment_and_reply_counts()
        print("counts", counts)
        return Response(counts)


class PostCommentCountsView(APIView):
    def get(self, request, pk, format=None):
        try:
            post = get_object_or_404(Post, pk=pk)
            comment_count = Comment.objects.filter(post_id=pk).count()
            reply_count = Reply.objects.filter(comment__post_id=pk).count()
            return Response({'comment_count': comment_count, 'reply_count': reply_count})
        except Http404:
            return Response({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ReplyListView(generics.ListAPIView):
    permission_classes = [IsAuthenticatedOrReadOnly]
    serializer_class = ReplySerializer

    def get_queryset(self):
        comment_pk = self.kwargs.get('pk')
        # print("comment_pk", comment_pk)
        try:
            comment = Comment.objects.get(pk=comment_pk)
            # print("comment", comment)
            return comment.replies.all()
        except Comment.DoesNotExist:
            return None

    def get(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())

        if queryset:
            serializer = self.get_serializer(queryset, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            return Response({'message': 'No replies found for this comment.'}, status=status.HTTP_204_NO_CONTENT)


class ReplyCreateView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated]
    queryset = Reply.objects.all()
    serializer_class = ReplySerializer

    def perform_create(self, serializer):
        comment_pk = self.kwargs['pk']
        try:
            comment = Comment.objects.get(pk=comment_pk)
        except Comment.DoesNotExist:
            raise serializers.ValidationError({'error': 'Comment not found'})
        serializer.save(author=self.request.user, comment=comment)
        serializer = CommentSerializer(comment)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class BookmarkToggleView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, college_pk):
        try:
            college = College.objects.get(pk=college_pk)
        except College.DoesNotExist:
            return Response({'error': 'College not found'}, status=status.HTTP_404_NOT_FOUND)

        try:
            bookmark = Bookmark.objects.get(user=request.user, college=college)
            serializer = BookmarkSerializer(bookmark)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Bookmark.DoesNotExist:
            return Response({'bookmarked': False}, status=status.HTTP_200_OK)

    def post(self, request, college_pk):
        try:
            college = College.objects.get(pk=college_pk)
        except College.DoesNotExist:
            return Response({'error': 'College not found'}, status=status.HTTP_404_NOT_FOUND)

        try:
            bookmark = Bookmark.objects.get(user=request.user, college=college)
            bookmark.delete()  # Remove bookmark if it exists
            return Response({'message': 'College unbookmarked'}, status=status.HTTP_200_OK)
        except Bookmark.DoesNotExist:
            # Create a dictionary of data for the serializer
            bookmark_data = {
                'user': request.user.id,  # Use user ID
                'college': college.id,  # Use college ID
            }

            serializer = BookmarkSerializer(data=bookmark_data)
            if serializer.is_valid():
                serializer.save()
                # Correct Response
                return Response({'message': 'College bookmarked'}, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class BookmarkedCollegesView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = CollegeSerializer

    def get_queryset(self):
        user = self.request.user
        bookmarks = Bookmark.objects.filter(
            user=user).select_related('college')
        return bookmarks

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        colleges = [bookmark.college for bookmark in queryset]  # Process here
        serializer = self.get_serializer(colleges, many=True)
        return Response(serializer.data)


class FriendRequestCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, friend_id, format=None):
        try:
            friend = get_object_or_404(User, pk=friend_id)
            friendship, created = Friendship.objects.get_or_create(
                user1=request.user,
                user2=friend,
            )
            if created:
                return Response({'message': 'Friend request sent'}, status=status.HTTP_201_CREATED)
            else:
                return Response({'message': 'Friend request already exists'}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class FriendRequestDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, friend_id, format=None):
        try:
            friend = get_object_or_404(User, pk=friend_id)
            friendship = Friendship.objects.get(
                user1=request.user, user2=friend)
            friendship.delete()
            return Response({'message': 'Friend request deleted'}, status=status.HTTP_204_NO_CONTENT)
        except Friendship.DoesNotExist:
            return Response({'error': 'Friend request not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class FriendRequestRespondView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, action, format=None):
        try:
            request_id = request.data.get('id')
            if not request_id:
                return Response({'error': 'Request ID is required'}, status=status.HTTP_400_BAD_REQUEST)

            friendship = get_object_or_404(Friendship, pk=request_id)

            if friendship.user2 != request.user:
                return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)

            if action == 'accept':
                friendship.status = 'accepted'
                friendship.save()
                return Response({'message': 'Friend request accepted'}, status=status.HTTP_200_OK)
            elif action == 'reject':
                friendship.delete()
                return Response({'message': 'Friend request rejected'}, status=status.HTTP_204_NO_CONTENT)
            else:
                return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PendingFriendRequestsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, format=None):
        try:
            pending_requests = Friendship.objects.filter(
                user2=request.user, status='pending')
            serializer = FriendshipSerializer(pending_requests, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class FriendsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id, format=None):
        try:
            user = get_object_or_404(User, pk=user_id)
            friendships = Friendship.objects.filter(
                user1=user,
                status='accepted',
            ) | Friendship.objects.filter(
                user2=user,
                status='accepted',
            )

            friends = [friendship.user1 for friendship in friendships if friendship.user1 != user] + \
                      [friendship.user2 for friendship in friendships if friendship.user2 != user]

            current_user = request.user
            is_friend = Friendship.objects.filter(
                user1=user,
                user2=current_user,
                status='accepted',
            ).exists() | Friendship.objects.filter(
                user1=current_user,
                user2=user,
                status='accepted',
            ).exists()

            is_pending = Friendship.objects.filter(
                user1=current_user,
                user2=user,
                status='pending',
            ).exists() | Friendship.objects.filter(
                user1=user,
                user2=current_user,
                status='pending',
            ).exists()

            serializer = UserSerializer(friends, many=True)
            return Response({'friends': serializer.data, 'is_friend': is_friend, 'is_pending': is_pending})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UnfriendView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, friend_id, format=None):
        try:
            friend = get_object_or_404(User, pk=friend_id)
            friendships = Friendship.objects.filter(
                user1=request.user,
                user2=friend,
                status='accepted',
            ) | Friendship.objects.filter(
                user1=friend,
                user2=request.user,
                status='accepted',
            )

            if friendships.exists():
                friendships.delete()
                return Response({'message': 'Friend removed'}, status=status.HTTP_204_NO_CONTENT)
            else:
                return Response({'error': 'Friendship not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class FriendRequestCountView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        pending_count = Friendship.objects.filter(
            user2=request.user, status='pending').count()
        accepted_count = Friendship.objects.filter(
            user2=request.user, status='accepted').count()
        return Response({'pending_count': pending_count, 'accepted_count': accepted_count})


class FriendRequestsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        friend_requests = Friendship.objects.filter(
            user2=request.user).order_by('-created_at')
        serializer = FriendshipSerializer(friend_requests, many=True)
        return Response(serializer.data)


class FriendRequestReadView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, request_id, format=None):
        try:
            friendship = get_object_or_404(Friendship, pk=request_id)
            friendship.read = True
            friendship.save()
            return Response({'message': 'Friend request read'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



# class NewsFeedView(APIView):
#     permission_classes = [IsAuthenticated]

#     def get(self, request):
#         try:
#             url = 'https://www.insidehighered.com/rss.xml'
#             response = requests.get(url)
#             response.raise_for_status()  # Raise HTTPError for bad responses (4xx or 5xx)
#             feed = feedparser.parse(response.text)
#             news = []
#             g = Goose()
#             for entry in feed.entries:
#                 try:
#                     article = g.extract(url=entry.link)

#                     cleaned_text = article.cleaned_text

#                     # Regex to remove the paywall text
#                     cleaned_text_regex = re.sub(
#                         r'(You have\s*\d+/\d+\s*articles left\.?\s*(?:Sign up for a free account|Log in|Sign in).*\s*)',
#                         '',
#                         cleaned_text,
#                         flags=re.IGNORECASE
#                     ).strip()

#                     # Additional method to clean text using split
#                     cleaned_text_split = ' '.join(part for part in cleaned_text.split(
#                         '\n') if 'You have' not in part).strip()

#                     # Select the method that returns the longest text
#                     if len(cleaned_text_regex) > len(cleaned_text_split):
#                         cleaned_text = cleaned_text_regex
#                     else:
#                         cleaned_text = cleaned_text_split

#                     news.append({
#                         'title': entry.title,
#                         'description': cleaned_text,
#                         'link': entry.link,
#                         'image_url': article.top_image,
#                         'article_id': entry.id
#                     })
#                 except Exception:
#                     news.append({
#                         'title': entry.title,
#                         'description':  BeautifulSoup(entry.summary, 'html.parser').get_text().strip(),
#                         'link': entry.link,
#                         'image_url': None,
#                         'article_id': entry.id
#                     })
#             return Response({'results': news}, status=status.HTTP_200_OK)
#         except requests.exceptions.RequestException as e:
#             print("request exception:", e)
#             return Response({'error': f"An unexpected error occurred: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
#         except Exception as e:
#             print("Exception:", e)
#             return Response({'error': f"An unexpected error occurred: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class NewsFeedView(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request):
        try:
            api_key = os.environ.get('NEWS_API_KEY')
            if not api_key:
                 return Response({'error': 'News API key not configured'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            news_items = []

            # 1. News API
            news_api_url = 'https://newsapi.org/v2/everything'
            today = datetime.now().date()
            from_date = today - timedelta(days=7)

            news_api_params = {
                'q': 'college OR university OR "higher education" AND (student OR faculty OR professor OR research OR "campus life" OR admissions OR tuition OR scholarships) NOT sports',
                'from': from_date.strftime('%Y-%m-%d'),
                'language': 'en',
                'sortBy': 'relevancy',
                'apiKey': api_key,
                'pageSize': 3,
            }
            news_api_response = requests.get(news_api_url, params=news_api_params)
            news_api_response.raise_for_status()
            news_api_data = news_api_response.json()

            for item in news_api_data.get('articles', []):
                description = item.get('description', '')
                if description:
                  description = "\n".join(description.split("\n")[:10])
                news_items.append({
                   'title': item.get('title'),
                   'description': description,
                   'link': item.get('url'),
                   'image_url': item.get('urlToImage'),
                   'article_id': item.get('url'),
                    'source': 'News API'
                })


            # 2. Inside Higher Ed RSS Feed
            inside_higher_ed_url = 'https://www.insidehighered.com/rss.xml'
            inside_higher_ed_feed = feedparser.parse(requests.get(inside_higher_ed_url).text)
            for entry in inside_higher_ed_feed.entries[:3]:
               summary = BeautifulSoup(entry.summary, 'html.parser').get_text().strip()
               if summary:
                  summary = "\n".join(summary.split("\n")[:10])
               news_items.append({
                  'title': entry.title,
                  'description': summary,
                  'link': entry.link,
                  'image_url': None,
                  'article_id': entry.id,
                  'source': 'Inside Higher Ed RSS'
               })


            # 3. College RSS Feeds
            college_rss_feeds = [
                {'name': 'MIT News', 'url': 'http://news.mit.edu/rss/feed.xml'},
                {'name': 'Harvard Gazette', 'url': 'https://news.harvard.edu/feed/'},
                {'name': 'Stanford News', 'url': 'https://news.stanford.edu/feed/'},
                 {'name': 'Yale News', 'url': 'https://news.yale.edu/rss'},
               {'name': 'Caltech News', 'url': 'https://www.caltech.edu/about/news/feed'},
               {'name': 'Princeton News', 'url': 'https://www.princeton.edu/news/feed'},
              {'name': 'UChicago News', 'url': 'https://news.uchicago.edu/rss'}

            ]


            for college in college_rss_feeds:
                try:
                    feed = feedparser.parse(requests.get(college['url']).text)
                    for entry in feed.entries[:2]:
                       summary = BeautifulSoup(entry.summary, 'html.parser').get_text().strip()
                       if summary:
                         summary = "\n".join(summary.split("\n")[:10])
                       news_items.append({
                         'title': entry.title,
                         'description': summary,
                         'link': entry.link,
                         'image_url': None,
                         'article_id': entry.id,
                         'source': college['name']
                       })
                except Exception as e:
                    print(f"Error fetching RSS feed for {college['name']}: {e}")

            return Response({'results': news_items}, status=status.HTTP_200_OK)

        except requests.exceptions.RequestException as e:
            print("request exception:", e)
            return Response({'error': f"An unexpected error occurred: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            print("Exception:", e)
            return Response({'error': f"An unexpected error occurred: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# class NewsAPIView(APIView):
#     permission_classes = [IsAuthenticated]

#     def get(self, request):
#         try:
#             api_key = os.environ.get('NEWS_API_KEY')
#             if not api_key:
#                 return Response({'error': 'News API key not configured'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

#             url = 'https://newsapi.org/v2/everything'
#             today = datetime.now().date()
#             from_date = today - timedelta(days=7)

#             params = {
#                 'q': 'college OR university OR "higher education" AND (student OR faculty OR professor OR research OR "campus life" OR admissions OR tuition OR scholarships) NOT sports',
#                 'from': from_date.strftime('%Y-%m-%d'),
#                 'language': 'en',
#                 'sortBy': 'relevancy',
#                 'apiKey': api_key,
#                 'pageSize': 5,
#             }
#             response = requests.get(url, params=params)
#             response.raise_for_status()
#             data = response.json()

#             articles = []
#             g = Goose()
#             for article in data.get('articles', []):
#                 try:
#                     article_goose = g.extract(url=article.get('url'))
#                     cleaned_text = article_goose.cleaned_text.strip()

#                     paragraphs = [p.strip() for p in cleaned_text.split("\n")]
#                     cleaned_text = "\n\n".join(paragraphs)

#                     articles.append({
#                         'title': article.get('title'),
#                         'description': cleaned_text,
#                         'link': article.get('url'),
#                         'image_url': article_goose.top_image if article_goose else None,
#                         'article_id': article.get('url')
#                     })
#                 except Exception:
#                     articles.append({
#                         'title': article.get('title'),
#                         'description': article.get('description'),
#                         'link': article.get('url'),
#                         'image_url': None,
#                         'article_id': article.get('url')
#                     })

#             return Response({'results': articles}, status=status.HTTP_200_OK)

#         except requests.exceptions.RequestException as e:
#             print("request exception:", e)
#             return Response({'error': f"An unexpected error occurred: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
#         except Exception as e:
#             print("Exception:", e)
#             return Response({'error': f"An unexpected error occurred: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



class NewsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            api_key = os.environ.get('NEWS_API_KEY')
            if not api_key:
                 return Response({'error': 'News API key not configured'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            url = 'https://newsapi.org/v2/everything'
            today = datetime.now().date()
            from_date = today - timedelta(days=7)

            params = {
                'q': 'college OR university OR "higher education" AND (student OR faculty OR professor OR research OR "campus life" OR admissions OR tuition OR scholarships) NOT sports',
                'from': from_date.strftime('%Y-%m-%d'),
                'language': 'en',
                 'sortBy': 'relevancy',
                'apiKey': api_key,
                'pageSize': 5,
            }
            response = requests.get(url, params=params)
            response.raise_for_status()
            data = response.json()

            articles = []
            g = Goose()
            for article in data.get('articles', []):
              try:
                article_goose = g.extract(url=article.get('url'))
                cleaned_text = article_goose.cleaned_text.strip()
                paragraphs = [p.strip() for p in cleaned_text.split("\n")]
               
                articles.append({
                    'title': article.get('title'),
                    'description': paragraphs,
                    'link': article.get('url'),
                    'image_url': article_goose.top_image if article_goose else None,
                    'article_id': article.get('url')
                })
              except Exception:
                articles.append({
                    'title': article.get('title'),
                    'description': article.get('description'),
                    'link': article.get('url'),
                    'image_url': None,
                     'article_id': article.get('url')
                    })

            return Response({'results': articles}, status=status.HTTP_200_OK)

        except requests.exceptions.RequestException as e:
            print("request exception:", e)
            return Response({'error': f"An unexpected error occurred: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            print("Exception:", e)
            return Response({'error': f"An unexpected error occurred: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)