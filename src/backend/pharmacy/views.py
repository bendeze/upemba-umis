from rest_framework import viewsets, status, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db import transaction
import openpyxl

from .models import Medicine, StockMovement, PharmacyStock, GlobalSettings, MedicineBatch, MedicalCenter
from .serializers import (
    MedicineSerializer, StockMovementSerializer, PharmacyStockSerializer,
    GlobalSettingsSerializer, MedicineBatchSerializer, MedicalCenterSerializer
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
