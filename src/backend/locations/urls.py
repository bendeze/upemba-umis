from django.urls import path, include
from rest_framework.routers import DefaultRouter
from locations.views import RegionViewSet, SiteViewSet

router = DefaultRouter()
router.register(r'regions', RegionViewSet, basename='region')
router.register(r'sites', SiteViewSet, basename='site')

urlpatterns = [
    path('', include(router.urls)),
]
