# Generated by Django 5.1 on 2024-12-19 10:29

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('collegetracker', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='smartcollege',
            name='enrollment_all',
            field=models.IntegerField(blank=True, null=True),
        ),
    ]
