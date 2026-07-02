from rest_framework import serializers
from locations.models import Region, Site

class RegionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Region
        fields = ['id', 'name', 'created_at', 'updated_at']


class SiteSerializer(serializers.ModelSerializer):
    region_name = serializers.CharField(source='region.name', read_only=True)

    class Meta:
        model = Site
        fields = ['id', 'name', 'region', 'region_name', 'created_at', 'updated_at']
