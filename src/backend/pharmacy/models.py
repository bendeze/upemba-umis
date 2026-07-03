import uuid
from django.db import models
from core.models import TimeStampedModel, SoftDeleteModel
from beneficiaries.models import Employee, Dependent
from django.utils import timezone


class GlobalSettings(TimeStampedModel):
    """Stores system-wide settings, ensuring only one row exists."""
    general_min_stock_level = models.IntegerField(default=10)
    
    def save(self, *args, **kwargs):
        self.pk = 1
        super(GlobalSettings, self).save(*args, **kwargs)

    @classmethod
    def load(cls):
        obj, created = cls.objects.get_or_create(pk=1)
        return obj

class MedicalCenter(TimeStampedModel):
    """
    Independent medical center for the pharmacy.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, unique=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name

class Medicine(TimeStampedModel, SoftDeleteModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, unique=True)
    unit = models.CharField(max_length=50) # e.g., tablet, bottle, box
    min_stock_level = models.IntegerField(null=True, blank=True, help_text="Overrides general minimum stock level if set")
    
    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.unit})"

class MedicineBatch(TimeStampedModel):
    """Tracks specific batches of medicine with expiration dates."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    medical_center = models.ForeignKey(MedicalCenter, on_delete=models.CASCADE, related_name='medicine_batches', null=True, blank=True)
    medicine = models.ForeignKey(Medicine, on_delete=models.CASCADE, related_name='batches')
    lot_number = models.CharField(max_length=100, default='UNKNOWN')
    expiration_date = models.DateField(null=True, blank=True)
    quantity = models.IntegerField(default=0) # Current remaining in this batch
    
    class Meta:
        unique_together = ('medical_center', 'medicine', 'lot_number')

    def __str__(self):
        return f"{self.medicine.name} - Lot {self.lot_number} at {self.medical_center.name if self.medical_center else 'No Site'} exp {self.expiration_date}: {self.quantity}"



class Prescription(TimeStampedModel):
    PATIENT_TYPES = [
        ('EMPLOYEE', 'Employee'),
        ('DEPENDENT', 'Dependent'),
        ('EXTERNAL', 'External'),
    ]
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('PARTIAL', 'Partially Dispensed'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    medical_center = models.ForeignKey(MedicalCenter, on_delete=models.CASCADE, related_name='prescriptions')
    consultation = models.ForeignKey('consultations.Consultation', on_delete=models.SET_NULL, null=True, blank=True, related_name='prescriptions')
    date = models.DateField(default=timezone.localdate)
    patient_type = models.CharField(max_length=20, choices=PATIENT_TYPES)
    
    # Links to registered patients (optional)
    employee = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, blank=True, related_name='prescriptions')
    dependent = models.ForeignKey(Dependent, on_delete=models.SET_NULL, null=True, blank=True, related_name='prescriptions')
    
    # For external patients or villagers not in the system
    external_patient_name = models.CharField(max_length=255, null=True, blank=True)
    
    prescribing_doctor = models.CharField(max_length=255, null=True, blank=True)
    diagnosis = models.TextField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')

    class Meta:
        ordering = ['-date', '-created_at']

    def __str__(self):
        patient = self.external_patient_name or (self.employee.nom if self.employee else "Unknown")
        return f"Prescription for {patient} on {self.date}"

class PrescriptionItem(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    prescription = models.ForeignKey(Prescription, on_delete=models.CASCADE, related_name='items')
    medicine = models.ForeignKey(Medicine, on_delete=models.CASCADE, related_name='prescribed_items')
    quantity_prescribed = models.IntegerField()
    quantity_dispensed = models.IntegerField(default=0)
    dosage_instructions = models.CharField(max_length=255, null=True, blank=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.quantity_prescribed}x {self.medicine.name} (Dispensed: {self.quantity_dispensed})"

class PharmacyStock(TimeStampedModel):
    """Aggregated current stock for a medicine at a specific site."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    medical_center = models.ForeignKey(MedicalCenter, on_delete=models.CASCADE, related_name='pharmacy_stocks', null=True, blank=True)
    medicine = models.ForeignKey(Medicine, on_delete=models.CASCADE, related_name='site_stocks')
    quantity = models.IntegerField(default=0)

    class Meta:
        unique_together = ('medical_center', 'medicine')

    def __str__(self):
        return f"{self.medicine.name} at {self.medical_center.name if self.medical_center else 'No Site'}: {self.quantity}"

class StockMovement(TimeStampedModel):
    MOVEMENT_TYPES = [
        ('IN', 'Entrance'),
        ('OUT', 'Exit'),
        ('HISTORICAL_OUT', 'Historical Exit'),
        ('DISPENSE', 'Dispensation'),
        ('ADJUST', 'Adjustment'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    medical_center = models.ForeignKey(MedicalCenter, on_delete=models.CASCADE, related_name='stock_movements', null=True, blank=True)
    medicine = models.ForeignKey(Medicine, on_delete=models.CASCADE, related_name='movements')
    prescription_item = models.ForeignKey(PrescriptionItem, on_delete=models.SET_NULL, null=True, blank=True, related_name='movements')
    movement_type = models.CharField(max_length=14, choices=MOVEMENT_TYPES)
    quantity = models.IntegerField() # always positive, movement_type determines add/subtract
    lot_number = models.CharField(max_length=100, null=True, blank=True)
    expiration_date = models.DateField(null=True, blank=True)
    date = models.DateField(default=timezone.localdate)
    notes = models.TextField(null=True, blank=True)

    class Meta:
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f"{self.movement_type} - {self.medicine.name} at {self.medical_center.name if self.medical_center else 'No Site'} ({self.quantity})"
