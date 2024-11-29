import graphene
from graphene_django import DjangoObjectType

from collegetracker.models import College


class CollegeType(DjangoObjectType):
    class Meta:
        model = College
        fields = '__all__'


class Query(graphene.ObjectType):
    colleges = graphene.List(CollegeType)
    college = graphene.Field(CollegeType, id=graphene.Int())
    college_by_name = graphene.List(
        CollegeType, name=graphene.String(required=True))

    def resolve_colleges(root, info):
        return College.objects.all()

    def resolve_college(root, info, id):
        return College.objects.get(pk=id)

    def resolve_college_by_name(root, info, name):
        try:
            return College.objects.filter(name=name)
        except College.DoesNotExist:
            return None


schema = graphene.Schema(query=Query)
