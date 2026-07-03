from rest_framework import viewsets, filters, status
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db import transaction
from .models import Consultation
from .serializers import ConsultationSerializer
from pharmacy.models import Prescription, PrescriptionItem

class ConsultationViewSet(viewsets.ModelViewSet):
    queryset = Consultation.objects.all().select_related('employee', 'dependent')
    serializer_class = ConsultationSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['medical_center', 'patient_type']
    search_fields = ['external_patient_name', 'doctor_name', 'symptoms', 'diagnosis']
    ordering_fields = ['date', 'created_at']
    ordering = ['-date', '-created_at']

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        # Allow creating consultation + prescription + items in one call
        prescription_data = request.data.pop('prescription', None)
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        consultation = serializer.save()

        if prescription_data and prescription_data.get('items'):
            prescription = Prescription.objects.create(
                medical_center=consultation.medical_center,
                consultation=consultation,
                date=consultation.date.date(),
                patient_type=consultation.patient_type,
                employee=consultation.employee,
                dependent=consultation.dependent,
                external_patient_name=consultation.external_patient_name,
                prescribing_doctor=consultation.doctor_name,
                diagnosis=consultation.diagnosis,
            )
            
            for item in prescription_data['items']:
                PrescriptionItem.objects.create(
                    prescription=prescription,
                    medicine_id=item['medicine_id'],
                    quantity_prescribed=item['quantity_prescribed'],
                    dosage_instructions=item.get('dosage_instructions', '')
                )
        
        # Reload to get the prescriptions attached
        consultation = Consultation.objects.get(id=consultation.id)
        result_serializer = self.get_serializer(consultation)
        return Response(result_serializer.data, status=status.HTTP_201_CREATED)

    @transaction.atomic
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        prescription_data = request.data.pop('prescription', None)
        
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        consultation = serializer.save()

        if prescription_data is not None:
            # Check existing prescriptions for this consultation
            # Our system currently models one prescription per consultation but it's a related_name='prescriptions'
            existing_prescription = consultation.prescriptions.first()
            
            if existing_prescription and existing_prescription.status != 'PENDING':
                # Reject prescription edits if already partially or fully dispensed
                pass # Or we could raise an exception, but let's just ignore the prescription change and let the clinical notes update succeed
            else:
                # If we have items to set
                if prescription_data.get('items'):
                    if not existing_prescription:
                        existing_prescription = Prescription.objects.create(
                            medical_center=consultation.medical_center,
                            consultation=consultation,
                            date=consultation.date.date(),
                            patient_type=consultation.patient_type,
                            employee=consultation.employee,
                            dependent=consultation.dependent,
                            external_patient_name=consultation.external_patient_name,
                            prescribing_doctor=consultation.doctor_name,
                            diagnosis=consultation.diagnosis,
                        )
                    else:
                        # Update fields just in case they changed
                        existing_prescription.diagnosis = consultation.diagnosis
                        existing_prescription.prescribing_doctor = consultation.doctor_name
                        existing_prescription.save()
                        
                        # Delete existing items and recreate to simplify
                        existing_prescription.items.all().delete()
                    
                    for item in prescription_data['items']:
                        PrescriptionItem.objects.create(
                            prescription=existing_prescription,
                            medicine_id=item['medicine_id'],
                            quantity_prescribed=item['quantity_prescribed'],
                            dosage_instructions=item.get('dosage_instructions', '')
                        )
                elif existing_prescription:
                    # If items array is empty but we passed prescription data, maybe they removed everything
                    existing_prescription.delete()
                    
        consultation = Consultation.objects.get(id=consultation.id)
        result_serializer = self.get_serializer(consultation)
        return Response(result_serializer.data)
