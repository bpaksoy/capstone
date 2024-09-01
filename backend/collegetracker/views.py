from .models import College
from django.http import JsonResponse   
from .serializers import CollegeSerializer 

def colleges(request):
    data  = College.objects.all()
    serializer = CollegeSerializer(data, many=True)
    return JsonResponse({"colleges":serializer.data})