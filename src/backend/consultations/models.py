from django.db import models
from django.utils import timezone
from beneficiaries.models import Employee, Dependent
from pharmacy.models import MedicalCenter
import uuid

class Consultation(models.Model):
    PATIENT_TYPE_CHOICES = [
        ('EMPLOYEE', 'Employee'),
        ('DEPENDENT', 'Dependent'),
        ('EXTERNAL', 'External / Villager'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    medical_center = models.ForeignKey(MedicalCenter, on_delete=models.CASCADE, related_name='consultations')
    date = models.DateTimeField(default=timezone.now)
    
    # Patient Info
    patient_type = models.CharField(max_length=20, choices=PATIENT_TYPE_CHOICES, default='EXTERNAL')
    employee = models.ForeignKey(Employee, null=True, blank=True, on_delete=models.SET_NULL, related_name='consultations')
    dependent = models.ForeignKey(Dependent, null=True, blank=True, on_delete=models.SET_NULL, related_name='consultations')
    external_patient_name = models.CharField(max_length=255, null=True, blank=True)
    
    # Clinical details
    doctor_name = models.CharField(max_length=255, null=True, blank=True)
    symptoms = models.TextField(null=True, blank=True)
    diagnosis = models.TextField(null=True, blank=True)
    notes = models.TextField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date']

    def __str__(self):
        patient = self.external_patient_name
        if self.patient_type == 'EMPLOYEE' and self.employee:
            patient = f"{self.employee.nom} {self.employee.prenom}"
        elif self.patient_type == 'DEPENDENT' and self.dependent:
            patient = self.dependent.nom_complet
            
        return f"Consultation for {patient} on {self.date.strftime('%Y-%m-%d')}"
