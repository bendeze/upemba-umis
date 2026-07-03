from rest_framework import serializers
from .models import Medicine, StockMovement, PharmacyStock, MedicineBatch, GlobalSettings, MedicalCenter, Prescription, PrescriptionItem

class GlobalSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = GlobalSettings
        fields = ['id', 'general_min_stock_level', 'updated_at']

class MedicalCenterSerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicalCenter
        fields = ['id', 'name', 'created_at']

class MedicineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Medicine
        fields = ['id', 'name', 'unit', 'min_stock_level', 'created_at']

class MedicineBatchSerializer(serializers.ModelSerializer):
    medicine = MedicineSerializer(read_only=True)
    medical_center = MedicalCenterSerializer(read_only=True)

    class Meta:
        model = MedicineBatch
        fields = ['id', 'medicine', 'medical_center', 'lot_number', 'expiration_date', 'quantity']

class PharmacyStockSerializer(serializers.ModelSerializer):
    medicine = MedicineSerializer(read_only=True)
    medical_center = MedicalCenterSerializer(read_only=True)
    
    # We can also compute the overall minimum stock level
    min_stock_level = serializers.SerializerMethodField()

    class Meta:
        model = PharmacyStock
        fields = ['id', 'medicine', 'medical_center', 'quantity', 'min_stock_level']
        
    def get_min_stock_level(self, obj):
        if obj.medicine.min_stock_level is not None:
            return obj.medicine.min_stock_level
        settings = GlobalSettings.load()
        return settings.general_min_stock_level

class StockMovementSerializer(serializers.ModelSerializer):
    medicine = MedicineSerializer(read_only=True)
    medicine_id = serializers.UUIDField(write_only=True)
    medical_center = MedicalCenterSerializer(read_only=True)
    medical_center_id = serializers.UUIDField(write_only=True)

    class Meta:
        model = StockMovement
        fields = ['id', 'medicine', 'medicine_id', 'medical_center', 'medical_center_id', 'movement_type', 'quantity', 'lot_number', 'expiration_date', 'date', 'notes', 'created_at']
        
    def validate(self, data):
        if data.get('movement_type') == 'IN' and not data.get('lot_number'):
            raise serializers.ValidationError({"lot_number": "Lot number is required when inserting new stock."})
        return data
        
    def create(self, validated_data):
        return StockMovement.objects.create(**validated_data)

class PrescriptionItemSerializer(serializers.ModelSerializer):
    medicine = MedicineSerializer(read_only=True)
    medicine_id = serializers.UUIDField(write_only=True)

    class Meta:
        model = PrescriptionItem
        fields = ['id', 'medicine', 'medicine_id', 'quantity_prescribed', 'quantity_dispensed', 'dosage_instructions']

class PrescriptionSerializer(serializers.ModelSerializer):
    items = PrescriptionItemSerializer(many=True, read_only=True)
    medical_center = MedicalCenterSerializer(read_only=True)
    medical_center_id = serializers.UUIDField(write_only=True)

    class Meta:
        model = Prescription
        fields = [
            'id', 'medical_center', 'medical_center_id', 'date', 'patient_type',
            'employee', 'dependent', 'external_patient_name',
            'prescribing_doctor', 'diagnosis', 'status', 'items'
        ]
