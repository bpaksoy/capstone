from django.contrib import admin
from .models import College, Comment, Post, Bookmark, Reply, User, SmartCollege, CollegeProgram, Article
from django.contrib.auth.admin import UserAdmin


admin.site.register(User)
# admin.site.register(College)
admin.site.register(Comment)
admin.site.register(Post)
admin.site.register(Bookmark)
admin.site.register(Reply)
admin.site.register(CollegeProgram)
admin.site.register(Article)
# admin.site.register(SmartCollege)


class CollegeAdmin(admin.ModelAdmin):
    list_display = ('name', 'city', 'state', 'admission_rate',
                    'sat_score', 'cost_of_attendance', 'UNITID')


admin.site.register(College, CollegeAdmin)


class SmartCollegeAdmin(admin.ModelAdmin):
    list_display = ('name', 'city', 'state', 'admission_rate',
                    'sat_score', 'cost_of_attendance')


admin.site.register(SmartCollege, SmartCollegeAdmin)
