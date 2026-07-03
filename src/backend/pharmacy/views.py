from rest_framework import viewsets, status, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db import transaction
import openpyxl

from .models import Medicine, StockMovement, PharmacyStock, GlobalSettings, MedicineBatch, MedicalCenter, Prescription, PrescriptionItem
from .serializers import (
    MedicineSerializer, StockMovementSerializer, PharmacyStockSerializer,
    GlobalSettingsSerializer, MedicineBatchSerializer, MedicalCenterSerializer,
    PrescriptionSerializer
)
from .services import PharmacyExcelService
from core.mixins import AutoInvalidateCacheMixin, invalidate_model_cache

class GlobalSettingsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        settings = GlobalSettings.load()
        serializer = GlobalSettingsSerializer(settings)
        return Response(serializer.data)

    def put(self, request):
        settings = GlobalSettings.load()
        serializer = GlobalSettingsSerializer(settings, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class MedicalCenterViewSet(AutoInvalidateCacheMixin, viewsets.ModelViewSet):
    queryset = MedicalCenter.objects.all()
    serializer_class = MedicalCenterSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['name']
    pagination_class = None

class MedicineViewSet(AutoInvalidateCacheMixin, viewsets.ModelViewSet):
    queryset = Medicine.objects.all()
    serializer_class = MedicineSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'reference_number']
    ordering_fields = ['name']
    pagination_class = None

class StockMovementViewSet(AutoInvalidateCacheMixin, viewsets.ModelViewSet):
    queryset = StockMovement.objects.all()
    serializer_class = StockMovementSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['medical_center', 'movement_type', 'medicine']
    ordering_fields = ['date', 'created_at']

    def perform_create(self, serializer):
        super().perform_create(serializer)
        invalidate_model_cache(PharmacyStock)
        invalidate_model_cache(MedicineBatch)

    def perform_update(self, serializer):
        super().perform_update(serializer)
        invalidate_model_cache(PharmacyStock)
        invalidate_model_cache(MedicineBatch)

    def perform_destroy(self, instance):
        super().perform_destroy(instance)
        invalidate_model_cache(PharmacyStock)
        invalidate_model_cache(MedicineBatch)

class PharmacyStockViewSet(AutoInvalidateCacheMixin, viewsets.ReadOnlyModelViewSet):
    queryset = PharmacyStock.objects.all()
    serializer_class = PharmacyStockSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['medical_center', 'medicine']
    ordering_fields = ['quantity']
    pagination_class = None

class MedicineBatchViewSet(AutoInvalidateCacheMixin, viewsets.ModelViewSet):
    queryset = MedicineBatch.objects.filter(quantity__gt=0)
    serializer_class = MedicineBatchSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['medical_center', 'medicine', 'expiration_date']
    ordering_fields = ['expiration_date']
    pagination_class = None

class ExcelRequisitionImportView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser]

    def post(self, request, medical_center_id, *args, **kwargs):
        if 'file' not in request.FILES:
            return Response({"detail": "No file uploaded."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            medical_center = MedicalCenter.objects.get(id=medical_center_id)
        except MedicalCenter.DoesNotExist:
            return Response({"detail": "Invalid medical center ID."}, status=status.HTTP_400_BAD_REQUEST)

        file_obj = request.FILES['file']
        if not file_obj.name.endswith(('.xlsx', '.xls')):
            return Response({"detail": "Invalid file format. Only .xlsx and .xls are supported."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            movements_created = PharmacyExcelService.import_requisitions(medical_center, file_obj)
            if movements_created:
                invalidate_model_cache(StockMovement)
                invalidate_model_cache(PharmacyStock)
                invalidate_model_cache(MedicineBatch)
            return Response({"success": True, "movements_created": movements_created}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"detail": f"Error processing file: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)
class ExcelConsumptionImportView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser]

    def post(self, request, medical_center_id, *args, **kwargs):
        if 'file' not in request.FILES:
            return Response({"detail": "No file uploaded."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            medical_center = MedicalCenter.objects.get(id=medical_center_id)
        except MedicalCenter.DoesNotExist:
            return Response({"detail": "Invalid medical center ID."}, status=status.HTTP_400_BAD_REQUEST)

        file_obj = request.FILES['file']
        if not file_obj.name.endswith(('.xlsx', '.xls')):
            return Response({"detail": "Invalid file format. Only .xlsx and .xls are supported."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            movements_created = PharmacyExcelService.import_consumptions(medical_center, file_obj)
            if movements_created:
                invalidate_model_cache(StockMovement)
                invalidate_model_cache(PharmacyStock)
                invalidate_model_cache(MedicineBatch)
            return Response({"success": True, "movements_created": movements_created}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"detail": f"Error processing file: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

from rest_framework.decorators import action

class PrescriptionViewSet(AutoInvalidateCacheMixin, viewsets.ModelViewSet):
    queryset = Prescription.objects.all().prefetch_related('items__medicine', 'medical_center', 'employee', 'dependent')
    serializer_class = PrescriptionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['medical_center', 'status', 'patient_type', 'date']
    ordering_fields = ['date', 'created_at']
    pagination_class = None

    def perform_create(self, serializer):
        prescription = serializer.save()
        items_data = self.request.data.get('items', [])
        for item_data in items_data:
            medicine_id = item_data.get('medicine_id')
            qty = item_data.get('quantity_prescribed')
            dosage = item_data.get('dosage_instructions', '')
            PrescriptionItem.objects.create(
                prescription=prescription,
                medicine_id=medicine_id,
                quantity_prescribed=qty,
                dosage_instructions=dosage
            )

    @action(detail=True, methods=['post'])
    def dispense(self, request, pk=None):
        prescription = self.get_object()
        item_quantities = request.data.get('items', {})
        user_notes = request.data.get('notes', 'Dispensed from prescription')
        
        try:
            with transaction.atomic():
                movements = PharmacyExcelService.dispense_prescription(prescription, item_quantities, user_notes)
                if movements:
                    invalidate_model_cache(StockMovement)
                    invalidate_model_cache(PharmacyStock)
                    invalidate_model_cache(MedicineBatch)
            
            return Response({"success": True, "movements_created": len(movements)}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
