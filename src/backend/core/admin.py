from django.contrib import admin
from core.models.audit import AuditLog

@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('timestamp', 'user', 'action', 'entity_type', 'entity_id')
    search_fields = ('entity_type', 'entity_id', 'user__username', 'action')
    list_filter = ('action', 'entity_type', 'timestamp')
    readonly_fields = ('id', 'user', 'action', 'entity_type', 'entity_id', 'changes', 'timestamp')
    ordering = ('-timestamp',)

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
