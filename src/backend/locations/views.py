from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from locations.models import Region, Site
from locations.serializers import RegionSerializer, SiteSerializer
from core.mixins import AutoInvalidateCacheMixin

class RegionViewSet(AutoInvalidateCacheMixin, viewsets.ModelViewSet):
    """
    ViewSet for viewing and creating regions.
    """
    queryset = Region.objects.all()
    serializer_class = RegionSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None

class SiteViewSet(AutoInvalidateCacheMixin, viewsets.ModelViewSet):
    """
    ViewSet for viewing sites, filterable by region.
    """
    queryset = Site.objects.all()
    serializer_class = SiteSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['region']
    pagination_class = None
