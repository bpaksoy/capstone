# Generated by Django 5.1 on 2024-12-22 13:42

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('collegetracker', '0004_collegeprogram_unitid'),
    ]

    operations = [
        migrations.AddField(
            model_name='collegeprogram',
            name='creddesc',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
    ]
