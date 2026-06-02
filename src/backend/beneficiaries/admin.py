from django.contrib import admin
from django.utils import timezone
from beneficiaries.models import Region, Site, Employee, Dependent

@admin.register(Region)
class RegionAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_at', 'updated_at')
    search_fields = ('name',)
    ordering = ('name',)


@admin.register(Site)
class SiteAdmin(admin.ModelAdmin):
    list_display = ('name', 'region', 'created_at', 'updated_at')
    search_fields = ('name', 'region__name')
    list_filter = ('region',)
    ordering = ('region', 'name')


class DependentInline(admin.TabularInline):
    model = Dependent
    extra = 0
    fields = ('full_name', 'gender', 'relationship', 'birth_date')


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = (
        'employee_number', 
        'nom', 
        'post_nom', 
        'prenom', 
        'site', 
        'employment_status', 
        'is_deleted',
        'created_at'
    )
    search_fields = ('employee_number', 'nom', 'post_nom', 'prenom', 'address')
    list_filter = ('site__region', 'site', 'employment_status', 'is_deleted')
    inlines = [DependentInline]
    ordering = ('nom', 'prenom')
    actions = ['soft_delete_action', 'restore_action']

    @admin.action(description="Soft-delete selected employees")
    def soft_delete_action(self, request, queryset):
        rows_updated = queryset.update(is_deleted=True, deleted_at=timezone.now() if hasattr(queryset, 'model') else None)
        self.message_user(request, f"{rows_updated} employees were soft-deleted successfully.")

    @admin.action(description="Restore soft-deleted employees")
    def restore_action(self, request, queryset):
        rows_updated = queryset.update(is_deleted=False, deleted_at=None)
        self.message_user(request, f"{rows_updated} employees were restored successfully.")


@admin.register(Dependent)
class DependentAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'employee', 'relationship', 'gender', 'birth_date', 'created_at')
    search_fields = ('full_name', 'employee__employee_number', 'employee__nom')
    list_filter = ('relationship', 'gender')
    ordering = ('employee', 'relationship', 'full_name')
