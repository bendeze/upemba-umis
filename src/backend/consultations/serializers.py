from rest_framework import serializers
from .models import Consultation
from pharmacy.models import Prescription, PrescriptionItem
from pharmacy.serializers import PrescriptionSerializer
from beneficiaries.serializers import EmployeeSerializer, DependentSerializer

class ConsultationSerializer(serializers.ModelSerializer):
    employee_details = EmployeeSerializer(source='employee', read_only=True)
    dependent_details = DependentSerializer(source='dependent', read_only=True)
    prescriptions = PrescriptionSerializer(many=True, read_only=True)

    class Meta:
        model = Consultation
        fields = '__all__'
