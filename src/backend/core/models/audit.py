import uuid
from django.db import models
from django.conf import settings

class AuditLog(models.Model):
    """
    Model for auditing critical system transactions.
    Tracks CRUD operations and Excel imports.
    """
    ACTION_CHOICES = [
        ('CREATE', 'Create'),
        ('UPDATE', 'Update'),
        ('DELETE', 'Delete'),
        ('RESTORE', 'Restore'),
        ('IMPORT', 'Import'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_logs'
    )
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    entity_type = models.CharField(max_length=50, db_index=True)  # e.g., 'Employee', 'Dependent'
    entity_id = models.CharField(max_length=255, db_index=True)    # ID of the targeted object
    changes = models.JSONField(default=dict, blank=True)         # JSON storing diffs, e.g., {"field": [old, new]}
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        user_str = self.user.username if self.user else "System"
        return f"{user_str} - {self.action} {self.entity_type} ({self.entity_id}) at {self.timestamp}"
