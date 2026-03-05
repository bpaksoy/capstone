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
    list_display = ('name', 'city', 'state', 'has_image', 'verified_picture')
    list_filter = ('verified_picture', 'state')
    search_fields = ('name', 'city', 'UNITID')
    list_editable = ('verified_picture',)

    def has_image(self, obj):
        return bool(obj.image)
    has_image.boolean = True
    has_image.short_description = 'Has Image'

admin.site.register(College, CollegeAdmin)


class SmartCollegeAdmin(admin.ModelAdmin):
    list_display = ('name', 'city', 'state', 'admission_rate',
                    'sat_score', 'cost_of_attendance')


admin.site.register(SmartCollege, SmartCollegeAdmin)
