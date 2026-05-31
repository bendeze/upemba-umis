from django.utils import timezone
from rest_framework import serializers
from beneficiaries.models import Region, Site, Employee, Dependent
from core.models.audit import AuditLog

class RegionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Region
        fields = ['id', 'name', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class SiteSerializer(serializers.ModelSerializer):
    region_name = serializers.ReadOnlyField(source='region.name')

    class Meta:
        model = Site
        fields = ['id', 'region', 'region_name', 'name', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class DependentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dependent
        fields = ['id', 'employee', 'full_name', 'gender', 'birth_date', 'relationship', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_birth_date(self, value):
        if value and value > timezone.now().date():
            raise serializers.ValidationError("Birth date cannot be in the future.")
        return value


class EmployeeSerializer(serializers.ModelSerializer):
    site_name = serializers.ReadOnlyField(source='site.name')
    region_name = serializers.ReadOnlyField(source='site.region.name')
    region_id = serializers.ReadOnlyField(source='site.region.id')
    dependents = DependentSerializer(many=True, read_only=True)

    class Meta:
        model = Employee
        fields = [
            'id', 
            'employee_number', 
            'last_name', 
            'post_name', 
            'first_name', 
            'site', 
            'site_name',
            'region_id',
            'region_name',
            'address', 
            'employment_status', 
            'dependents', 
            'created_at', 
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class EmployeeCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employee
        fields = [
            'id', 
            'employee_number', 
            'last_name', 
            'post_name', 
            'first_name', 
            'site', 
            'address', 
            'employment_status'
        ]
        read_only_fields = ['id']

    def validate_employee_number(self, value):
        # Allow updates to keep their existing number
        instance = self.instance
        qs = Employee.objects.filter(employee_number=value)
        if instance:
            qs = qs.exclude(pk=instance.pk)
        if qs.exists():
            raise serializers.ValidationError("This employee number is already in use.")
        return value


class AuditLogSerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(source='user.username')

    class Meta:
        model = AuditLog
        fields = ['id', 'username', 'action', 'entity_type', 'entity_id', 'changes', 'timestamp']
        read_only_fields = ['id', 'timestamp']
