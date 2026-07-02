from rest_framework import viewsets, status, filters, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import get_object_or_404
from core.permissions import HasValidSignature

import io
import requests
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Side, Border
from django.db.models import Q
from django.http import HttpResponse

from beneficiaries.models import Employee, Dependent
from core.models.audit import AuditLog
from beneficiaries.serializers import (
    DependentSerializer,
    EmployeeSerializer,
    EmployeeCreateUpdateSerializer,
    AuditLogSerializer
)
from beneficiaries.services import EmployeeService, DependentService, ExcelImportService, CloudImportService, EmployeeExportService
from core.mixins import AutoInvalidateCacheMixin, invalidate_model_cache

class EmployeeViewSet(AutoInvalidateCacheMixin, viewsets.ModelViewSet):
    """
    ViewSet for managing employees.
    Supports soft deletes, advanced search, filtering, and nested dependents listing.
    """
    queryset = Employee.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['site', 'site__region', 'employment_status']
    search_fields = ['employee_number', 'nom', 'post_nom', 'prenom', 'address']
    ordering_fields = ['nom', 'employee_number', 'created_at']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return EmployeeCreateUpdateSerializer
        return EmployeeSerializer

    def perform_create(self, serializer):
        # Delegate creation to the Employee Service to guarantee transaction integrity
        data = serializer.validated_data
        employee = EmployeeService.create_employee(
            user=self.request.user,
            employee_number=data['employee_number'],
            nom=data['nom'],
            prenom=data['prenom'],
            site_id=data['site'].id,
            post_nom=data.get('post_nom'),
            address=data.get('address'),
            employment_status=data.get('employment_status', 'ACTIVE')
        )
        # Set the serializer instance to the created model
        serializer.instance = employee
        invalidate_model_cache(Employee)

    def perform_update(self, serializer):
        # Delegate updates to the Employee Service to audit all changes
        data = serializer.validated_data
        employee = EmployeeService.update_employee(
            user=self.request.user,
            employee_id=self.get_object().id,
            **data
        )
        serializer.instance = employee
        invalidate_model_cache(Employee)

    def perform_destroy(self, instance):
        # Delegate soft deletion to the Service Layer
        EmployeeService.delete_employee(user=self.request.user, employee_id=instance.id)
        invalidate_model_cache(Employee)

    @action(detail=True, methods=['post'], url_path='dependents')
    def add_dependent(self, request, pk=None):
        """
        Custom action to add a dependent directly linked to this employee.
        """
        employee = self.get_object()
        serializer = DependentSerializer(data=request.data)
        if serializer.is_valid():
            try:
                dependent = DependentService.add_dependent(
                    user=request.user,
                    employee_id=employee.id,
                    full_name=serializer.validated_data['full_name'],
                    gender=serializer.validated_data['gender'],
                    relationship=serializer.validated_data['relationship'],
                    birth_date=serializer.validated_data.get('birth_date')
                )
                invalidate_model_cache(Employee)
                invalidate_model_cache(Dependent)
                return Response(DependentSerializer(dependent).data, status=status.HTTP_201_CREATED)
            except ValueError as e:
                return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DependentViewSet(AutoInvalidateCacheMixin, viewsets.ModelViewSet):
    """
    ViewSet for viewing and updating single dependents.
    """
    queryset = Dependent.objects.all()
    serializer_class = DependentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ['full_name']


class ExcelImportView(APIView):
    """
    API endpoint to upload and process historical beneficiary Excel workbooks.
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser]

    def post(self, request, *args, **kwargs):
        if 'file' not in request.FILES:
            return Response({"detail": "No file was uploaded. Please attach an Excel workbook under the key 'file'."}, status=status.HTTP_400_BAD_REQUEST)
            
        file_obj = request.FILES['file']
        
        # Verify file suffix
        if not file_obj.name.endswith(('.xlsx', '.xls')):
            return Response({"detail": "Invalid file format. Only .xlsx and .xls Excel workbooks are supported."}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            # Process Excel using ExcelImportService
            report = ExcelImportService.import_excel(user=request.user, file_file=file_obj)
            if report.get("success"):
                invalidate_model_cache(Employee)
                invalidate_model_cache(Dependent)
            return Response(report, status=status.HTTP_200_OK if report["success"] else status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                "success": False,
                "summary": {"errors_count": 1, "warnings_count": 0},
                "logs": [{"level": "ERROR", "sheet": "System", "row": None, "message": f"Critical parsing failure: {str(e)}"}]
            }, status=status.HTTP_400_BAD_REQUEST)


class AuditLogListView(generics.ListAPIView):
    """
    Read-only view for monitoring audit trails.
    """
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['entity_type', 'entity_id', 'action']
    

class ExcelImportUrlView(APIView):
    """
    API endpoint to download and process a historical beneficiary Excel workbook from a public cloud URL.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        url = request.data.get('url')
        if not url:
            return Response({"detail": "No URL was provided. Please send a 'url' parameter."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            file_obj = CloudImportService.download_and_convert_url(url)
            report = ExcelImportService.import_excel(user=request.user, file_file=file_obj)
            if report.get("success"):
                invalidate_model_cache(Employee)
                invalidate_model_cache(Dependent)
            return Response(report, status=status.HTTP_200_OK if report["success"] else status.HTTP_400_BAD_REQUEST)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                "success": False,
                "summary": {"errors_count": 1, "warnings_count": 0},
                "logs": [{"level": "ERROR", "sheet": "System", "row": None, "message": f"Critical cloud parsing failure: {str(e)}"}]
            }, status=status.HTTP_400_BAD_REQUEST)


class ExcelExportView(APIView):
    """
    API endpoint to export the beneficiary roster as a styled, structured Excel sheet.
    Supports active filters (search, region, site, status) for filtered exports.
    """
    permission_classes = [IsAuthenticated | HasValidSignature]

    def get(self, request, *args, **kwargs):
        # 1. Fetch filtered queryset
        queryset = Employee.objects.all()
        
        # Apply identical filters as EmployeeViewSet
        search = request.query_params.get('search')
        region_id = request.query_params.get('site__region')
        site_id = request.query_params.get('site')
        status_filter = request.query_params.get('employment_status')
        
        if search:
            queryset = queryset.filter(
                Q(employee_number__icontains=search) |
                Q(nom__icontains=search) |
                Q(post_nom__icontains=search) |
                Q(prenom__icontains=search) |
                Q(address__icontains=search)
            )
        if region_id:
            queryset = queryset.filter(site__region_id=region_id)
        if site_id:
            queryset = queryset.filter(site_id=site_id)
        if status_filter:
            queryset = queryset.filter(employment_status=status_filter)
            
        # Optimize database accesses with prefetch
        queryset = queryset.select_related('site', 'site__region').prefetch_related('dependents')
        
        # 2. Build Excel Workbook via Service Layer
        wb = EmployeeExportService.export_to_excel(queryset)
            
        # 3. HTTP response
        response = HttpResponse(
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
        response["Content-Disposition"] = 'attachment; filename="umis_roster_export.xlsx"'
        wb.save(response)
        return response
