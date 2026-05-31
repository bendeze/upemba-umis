from rest_framework import viewsets, status, filters, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import get_object_or_404

from beneficiaries.models import Region, Site, Employee, Dependent
from core.models.audit import AuditLog
from beneficiaries.serializers import (
    RegionSerializer,
    SiteSerializer,
    DependentSerializer,
    EmployeeSerializer,
    EmployeeCreateUpdateSerializer,
    AuditLogSerializer
)
from beneficiaries.services import EmployeeService, DependentService, ExcelImportService


class RegionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing and creating regions.
    """
    queryset = Region.objects.all()
    serializer_class = RegionSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None


class SiteViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing sites, filterable by region.
    """
    queryset = Site.objects.all()
    serializer_class = SiteSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['region']
    pagination_class = None


class EmployeeViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing employees.
    Supports soft deletes, advanced search, filtering, and nested dependents listing.
    """
    queryset = Employee.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['site', 'site__region', 'employment_status']
    search_fields = ['employee_number', 'last_name', 'post_name', 'first_name', 'address']
    ordering_fields = ['last_name', 'employee_number', 'created_at']

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
            last_name=data['last_name'],
            first_name=data['first_name'],
            site_id=data['site'].id,
            post_name=data.get('post_name'),
            address=data.get('address'),
            employment_status=data.get('employment_status', 'ACTIVE')
        )
        # Set the serializer instance to the created model
        serializer.instance = employee

    def perform_update(self, serializer):
        # Delegate updates to the Employee Service to audit all changes
        data = serializer.validated_data
        employee = EmployeeService.update_employee(
            user=self.request.user,
            employee_id=self.get_object().id,
            **data
        )
        serializer.instance = employee

    def perform_destroy(self, instance):
        # Delegate soft deletion to the Service Layer
        EmployeeService.delete_employee(user=self.request.user, employee_id=instance.id)

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
                return Response(DependentSerializer(dependent).data, status=status.HTTP_201_CREATED)
            except ValueError as e:
                return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DependentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing and updating single dependents.
    """
    queryset = Dependent.objects.all()
    serializer_class = DependentSerializer
    permission_classes = [IsAuthenticated]


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
