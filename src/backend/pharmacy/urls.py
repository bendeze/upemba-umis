from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    MedicineViewSet, StockMovementViewSet, PharmacyStockViewSet, 
    GlobalSettingsView, MedicineBatchViewSet, ExcelRequisitionImportView,
    ExcelConsumptionImportView, MedicalCenterViewSet, PrescriptionViewSet
)

router = DefaultRouter()
router.register(r'medical-centers', MedicalCenterViewSet)
router.register(r'medicines', MedicineViewSet)
router.register(r'stock-movements', StockMovementViewSet)
router.register(r'pharmacy-stock', PharmacyStockViewSet)
router.register(r'medicine-batches', MedicineBatchViewSet)
router.register(r'prescriptions', PrescriptionViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('settings/', GlobalSettingsView.as_view(), name='pharmacy-settings'),
    path('import-requisition/<uuid:medical_center_id>/', ExcelRequisitionImportView.as_view(), name='pharmacy-import-requisition'),
    path('import-consumption/<uuid:medical_center_id>/', ExcelConsumptionImportView.as_view(), name='pharmacy-import-consumption'),
]
