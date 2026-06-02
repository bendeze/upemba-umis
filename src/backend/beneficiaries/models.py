import uuid
from django.db import models
from core.models import TimeStampedModel, SoftDeleteModel

class Region(TimeStampedModel):
    """
    Region of operations (e.g., Lubumbashi, Park Headquarters).
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, unique=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class Site(TimeStampedModel):
    """
    Operational healthcare facility or work site inside a region.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    region = models.ForeignKey(Region, on_delete=models.SET_NULL, null=True, blank=True, related_name='sites')
    name = models.CharField(max_length=255)

    class Meta:
        ordering = ['name']
        constraints = [
            models.UniqueConstraint(fields=['name', 'region'], name='unique_site_per_region')
        ]

    def __str__(self):
        return f"{self.name} ({self.region.name})"


class Employee(TimeStampedModel, SoftDeleteModel):
    """
    Employees of Upemba National Park.
    """
    STATUS_CHOICES = [
        ('ACTIVE', 'Active'),
        ('INACTIVE', 'Inactive'),
        ('SUSPENDED', 'Suspended'),
        ('RETIRED', 'Retired'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee_number = models.CharField(max_length=100, unique=True, db_index=True)
    nom = models.CharField(max_length=255)
    post_nom = models.CharField(max_length=255, null=True, blank=True)
    prenom = models.CharField(max_length=255)
    site = models.ForeignKey(Site, on_delete=models.SET_NULL, null=True, blank=True, related_name='employees')
    address = models.TextField(null=True, blank=True)
    employment_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')

    class Meta:
        ordering = ['nom', 'prenom']

    def __str__(self):
        post_name_str = f" {self.post_nom}" if self.post_nom else ""
        return f"[{self.employee_number}] {self.nom}{post_name_str} {self.prenom}"


class Dependent(TimeStampedModel):
    """
    Eligible dependents of an employee (Spouse or Child).
    """
    RELATIONSHIP_CHOICES = [
        ('SPOUSE', 'Spouse'),
        ('CHILD', 'Child'),
    ]

    GENDER_CHOICES = [
        ('M', 'Male'),
        ('F', 'Female'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='dependents')
    full_name = models.CharField(max_length=255)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES)
    birth_date = models.DateField(null=True, blank=True)
    relationship = models.CharField(max_length=20, choices=RELATIONSHIP_CHOICES)

    class Meta:
        ordering = ['relationship', 'full_name']
        constraints = [
            models.UniqueConstraint(
                fields=['employee', 'full_name', 'relationship'],
                name='unique_dependent_per_employee'
            )
        ]

    def __str__(self):
        return f"{self.full_name} ({self.relationship} of {self.employee.employee_number})"
