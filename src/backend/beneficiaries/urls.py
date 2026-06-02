from django.urls import path, include
from rest_framework.routers import DefaultRouter
from beneficiaries.views import (
    RegionViewSet,
    SiteViewSet,
    EmployeeViewSet,
    DependentViewSet,
    ExcelImportView,
    ExcelImportUrlView,
    ExcelExportView,
    AuditLogListView
)

router = DefaultRouter()
router.register(r'regions', RegionViewSet, basename='region')
router.register(r'sites', SiteViewSet, basename='site')
router.register(r'employees', EmployeeViewSet, basename='employee')
router.register(r'dependents', DependentViewSet, basename='dependent')

urlpatterns = [
    # Include REST routers
    path('', include(router.urls)),
    
    # Custom business endpoints
    path('beneficiaries/import/', ExcelImportView.as_view(), name='beneficiaries-import'),
    path('beneficiaries/import-url/', ExcelImportUrlView.as_view(), name='beneficiaries-import-url'),
    path('beneficiaries/export/', ExcelExportView.as_view(), name='beneficiaries-export'),
    path('audit-logs/', AuditLogListView.as_view(), name='audit-logs-list'),
]
