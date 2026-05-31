import io
import openpyxl
from django.test import TestCase
from django.contrib.auth.models import User
from django.utils import timezone
from django.db import IntegrityError
from core.models.audit import AuditLog
from beneficiaries.models import Region, Site, Employee, Dependent
from beneficiaries.services import EmployeeService, DependentService, ExcelImportService

class BeneficiariesModelTests(TestCase):
    def setUp(self):
        self.region = Region.objects.create(name="Lubumbashi")
        self.site = Site.objects.create(name="Main Facility", region=self.region)

    def test_region_creation(self):
        self.assertEqual(self.region.name, "Lubumbashi")

    def test_site_creation(self):
        self.assertEqual(self.site.name, "Main Facility")
        self.assertEqual(self.site.region, self.region)

    def test_employee_soft_delete(self):
        # Create employee
        emp = Employee.objects.create(
            employee_number="EMP-001",
            last_name="ILUNGA",
            first_name="Jean",
            site=self.site
        )
        
        # Verify it shows up in standard query
        self.assertTrue(Employee.objects.filter(pk=emp.pk).exists())
        
        # Soft delete
        emp.delete()
        
        # Verify it is hidden in standard manager query
        self.assertFalse(Employee.objects.filter(pk=emp.pk).exists())
        
        # Verify it still exists in all_objects manager
        self.assertTrue(Employee.all_objects.filter(pk=emp.pk).exists())
        
        # Restore
        emp.restore()
        self.assertTrue(Employee.objects.filter(pk=emp.pk).exists())


class BeneficiariesServiceTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="testuser", password="password")
        self.region = Region.objects.create(name="Upemba North")
        self.site = Site.objects.create(name="Station Lusinga", region=self.region)

    def test_create_employee_service(self):
        emp = EmployeeService.create_employee(
            user=self.user,
            employee_number="EMP-100",
            last_name="mutombo",
            first_name="Felix",
            site_id=self.site.pk,
            post_name="kabange",
            address="Lusinga Station HQ"
        )
        
        # Verify last name converted to uppercase
        self.assertEqual(emp.last_name, "MUTOMBO")
        self.assertEqual(emp.post_name, "kabange")
        self.assertEqual(emp.first_name, "Felix")
        
        # Verify audit log was created
        audit = AuditLog.objects.filter(entity_id=str(emp.pk)).first()
        self.assertIsNotNone(audit)
        self.assertEqual(audit.action, "CREATE")
        self.assertEqual(audit.user, self.user)

    def test_update_employee_service(self):
        emp = EmployeeService.create_employee(
            user=self.user,
            employee_number="EMP-101",
            last_name="KABULO",
            first_name="Marc",
            site_id=self.site.pk
        )
        
        EmployeeService.update_employee(
            user=self.user,
            employee_id=emp.pk,
            first_name="Marcus",
            employment_status="INACTIVE"
        )
        
        emp.refresh_from_db()
        self.assertEqual(emp.first_name, "Marcus")
        self.assertEqual(emp.employment_status, "INACTIVE")
        
        # Verify audit logs track updates
        updates = AuditLog.objects.filter(entity_id=str(emp.pk), action="UPDATE")
        self.assertTrue(updates.exists())
        self.assertIn("first_name", updates.first().changes)

    def test_add_dependent_service(self):
        emp = EmployeeService.create_employee(
            user=self.user,
            employee_number="EMP-102",
            last_name="KABILA",
            first_name="Joseph",
            site_id=self.site.pk
        )
        
        dep = DependentService.add_dependent(
            user=self.user,
            employee_id=emp.pk,
            full_name="Olive Lembe",
            gender="F",
            relationship="SPOUSE"
        )
        
        self.assertEqual(dep.full_name, "Olive Lembe")
        self.assertEqual(dep.relationship, "SPOUSE")
        
        # Block duplicates
        with self.assertRaises(ValueError):
            DependentService.add_dependent(
                user=self.user,
                employee_id=emp.pk,
                full_name="Olive Lembe",
                gender="F",
                relationship="SPOUSE"
            )


class ExcelImportServiceTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="importer", password="password")

    def test_excel_import_pipeline(self):
        # Create a mock Excel file in memory
        wb = openpyxl.Workbook()
        
        # Sheet represents the Region name "Lusinga Region"
        sheet = wb.active
        sheet.title = "Lusinga Region"
        
        # Headers: N, Nom, Post-nom et Prénom, Épouse, Nom de l'enfant, Année de naissance, Sexe, Addresse
        headers = ["N", "Nom", "Post-nom et Prénom", "Épouse", "Nom de l'enfant", "Année de naissance", "Sexe", "Addresse"]
        sheet.append(headers)
        
        # Row 1: Employee with spouse and a child
        sheet.append(["001", "Kyalangilwa", "Mwamba Jean", "Therese Kyabu", "Prince Mwamba", "2010", "M", "Station Lusinga Q1"])
        # Row 2: Same employee, additional child (empty employee details, but child details present)
        sheet.append(["", "", "", "", "Sarah Mwamba", "2015", "F", ""])
        # Row 3: Second employee, no spouse, one child
        sheet.append(["002", "Kasongo", "Mukadi Pierre", "", "Alice Kasongo", "2018", "F", "Station Lusinga Q2"])
        
        excel_file = io.BytesIO()
        wb.save(excel_file)
        excel_file.seek(0)
        
        # Execute Import Service
        report = ExcelImportService.import_excel(user=self.user, file_file=excel_file)
        
        # Assert report metrics
        self.assertTrue(report["success"])
        self.assertEqual(report["summary"]["regions_created"], 1)
        self.assertEqual(report["summary"]["sites_created"], 1)
        self.assertEqual(report["summary"]["employees_created"], 2)
        self.assertEqual(report["summary"]["dependents_created"], 4) # Spouse (Therese), Child 1 (Prince), Child 2 (Sarah), Child 3 (Alice)
        
        # Verify DB entries
        region = Region.objects.filter(name="Lusinga Region").first()
        self.assertIsNotNone(region)
        
        emp1 = Employee.objects.filter(last_name="KYALANGILWA", post_name="Mwamba", first_name="Jean").first()
        self.assertIsNotNone(emp1)
        self.assertEqual(emp1.employee_number, "EMP-2026-0001")
        self.assertEqual(emp1.address, "Station Lusinga Q1")
        
        # Verify dependents for emp1
        deps1 = emp1.dependents.all()
        self.assertEqual(deps1.count(), 3)
        
        spouse = deps1.filter(relationship="SPOUSE").first()
        self.assertIsNotNone(spouse)
        self.assertEqual(spouse.full_name, "Therese Kyabu")
        self.assertEqual(spouse.gender, "F")
        
        child1 = deps1.filter(relationship="CHILD", full_name="Prince Mwamba").first()
        self.assertIsNotNone(child1)
        self.assertEqual(child1.gender, "M")
        self.assertEqual(child1.birth_date.year, 2010)
        
        child2 = deps1.filter(relationship="CHILD", full_name="Sarah Mwamba").first()
        self.assertIsNotNone(child2)
        self.assertEqual(child2.gender, "F")
        self.assertEqual(child2.birth_date.year, 2015)
        
        # Verify emp2
        emp2 = Employee.objects.filter(last_name="KASONGO").first()
        self.assertIsNotNone(emp2)
        self.assertEqual(emp2.employee_number, "EMP-2026-0002")
        self.assertEqual(emp2.dependents.count(), 1)
        self.assertEqual(emp2.dependents.first().full_name, "Alice Kasongo")
