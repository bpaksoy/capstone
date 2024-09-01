from django.db import models


class College(models.Model):
    name = models.CharField(max_length=100)
    city = models.CharField(max_length=50)
    state = models.CharField(max_length=50)
    website = models.URLField(max_length=200)
    description = models.TextField()

    def __str__(self):
        return self.name + ' - ' + self.city + ', ' + self.state + ', ' + self.website