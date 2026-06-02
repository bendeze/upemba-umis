from rest_framework import viewsets, status, filters, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import get_object_or_404

import io
import requests
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Side, Border
from django.db.models import Q
from django.http import HttpResponse

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

import io
import requests
from django.http import HttpResponse
from django.db.models import Q
import openpyxl
from openpyxl.styles import Font, Alignment, PatternFill, Border, Side


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
        
        # Google Sheets auto-conversion logic
        original_url = url.strip()
        cleaned_url = original_url
        if 'docs.google.com/spreadsheets' in cleaned_url:
            if '/edit' in cleaned_url:
                cleaned_url = cleaned_url.split('/edit')[0] + '/export?format=xlsx'
            elif not cleaned_url.endswith('/export?format=xlsx'):
                if cleaned_url.endswith('/'):
                    cleaned_url = cleaned_url + 'export?format=xlsx'
                else:
                    cleaned_url = cleaned_url + '/export?format=xlsx'

        try:
            # Fetch remote Excel file
            response = requests.get(cleaned_url, timeout=30)
            if response.status_code != 200:
                return Response({"detail": f"Failed to download file from URL (HTTP {response.status_code})."}, status=status.HTTP_400_BAD_REQUEST)
            
            # Wrap content in BytesIO for openpyxl compatibility
            file_obj = io.BytesIO(response.content)
            
            # Simple XLSX validation check
            content_start = response.content[:4]
            if content_start != b'PK\x03\x04' and not cleaned_url.lower().endswith(('.xlsx', '.xls')):
                return Response({"detail": "Invalid file content. The cloud URL must point to a valid Excel workbook (.xlsx or .xls)."}, status=status.HTTP_400_BAD_REQUEST)

            # Process Excel using existing ExcelImportService
            report = ExcelImportService.import_excel(user=request.user, file_file=file_obj)
            return Response(report, status=status.HTTP_200_OK if report["success"] else status.HTTP_400_BAD_REQUEST)
        except requests.exceptions.RequestException as e:
            return Response({"detail": f"Network error fetching cloud URL: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)
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
    permission_classes = [IsAuthenticated]

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
        
        # 2. Build Excel Workbook
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "UMIS_Roster"
        
        # Medical Teal-600 Harmonious Styles
        header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
        header_fill = PatternFill(start_color="0D9488", end_color="0D9488", fill_type="solid") # Teal-600
        center_align = Alignment(horizontal="center", vertical="center", wrap_text=True)
        left_align = Alignment(horizontal="left", vertical="center", wrap_text=True)
        
        thin_side = Side(border_style="thin", color="E2E8F0") # Slate-200
        border_all = Border(left=thin_side, right=thin_side, top=thin_side, bottom=thin_side)
        
        headers = [
            "Matricule (Employee ID)", 
            "Nom (Last Name)", 
            "Post-nom & Prénom", 
            "Épouse (Spouse)", 
            "Nom de l'enfant (Child)", 
            "Sexe (Gender)", 
            "Année de naissance", 
            "Adresse (Address)", 
            "Site", 
            "Région", 
            "Statut (Status)"
        ]
        
        # Set Row 1 Header style
        ws.row_dimensions[1].height = 28
        for col_num, header in enumerate(headers, 1):
            cell = ws.cell(row=1, column=col_num)
            cell.value = header
            cell.font = header_font
            cell.fill = header_fill
            cell.alignment = center_align
            cell.border = border_all
            
        # Write dataset
        row_num = 2
        for emp in queryset:
            spouses = [d for d in emp.dependents.all() if d.relationship == 'SPOUSE']
            children = [d for d in emp.dependents.all() if d.relationship == 'CHILD']
            
            max_rows = max(1, len(spouses), len(children))
            
            for i in range(max_rows):
                ws.row_dimensions[row_num].height = 20
                
                # Write parent info on all rows
                ws.cell(row=row_num, column=1, value=emp.employee_number)
                if i == 0:
                    ws.cell(row=row_num, column=2, value=emp.nom)
                    post_name_str = f" {emp.post_nom}" if emp.post_nom else ""
                    ws.cell(row=row_num, column=3, value=f"{post_name_str.strip()} {emp.prenom}".strip())
                    ws.cell(row=row_num, column=8, value=emp.address)
                    ws.cell(row=row_num, column=9, value=emp.site.name if emp.site else "Non assigné")
                    ws.cell(row=row_num, column=10, value=emp.site.region.name if emp.site and emp.site.region else "Sans région")
                    ws.cell(row=row_num, column=11, value=emp.employment_status)
                
                # Write Spouse (if any)
                if i < len(spouses):
                    ws.cell(row=row_num, column=4, value=spouses[i].full_name)
                    
                # Write Child (if any)
                if i < len(children):
                    ws.cell(row=row_num, column=5, value=children[i].full_name)
                    ws.cell(row=row_num, column=6, value=children[i].gender)
                    if children[i].birth_date:
                        ws.cell(row=row_num, column=7, value=children[i].birth_date.year)
                
                # Apply alignments & borders
                for col_num in range(1, 12):
                    cell = ws.cell(row=row_num, column=col_num)
                    cell.border = border_all
                    if col_num in [1, 6, 7, 11]:
                        cell.alignment = center_align
                    else:
                        cell.alignment = left_align
                        
                row_num += 1
                
        # Auto-fit column widths
        for col in ws.columns:
            max_len = 0
            for cell in col:
                if cell.value:
                    max_len = max(max_len, len(str(cell.value)))
            col_letter = openpyxl.utils.get_column_letter(col[0].column)
            ws.column_dimensions[col_letter].width = max(max_len + 3, 12)
            
        # 3. HTTP response
        response = HttpResponse(
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
        response["Content-Disposition"] = 'attachment; filename="umis_roster_export.xlsx"'
        wb.save(response)
        return response
