from .models.audit import AuditLog

def log_action(user, action, instance, changes=None):
    """
    Utility function to log standard CRUD or import transactions.
    
    :param user: The user performing the action (can be None or Anonymous).
    :param action: Action type ('CREATE', 'UPDATE', 'DELETE', 'RESTORE', 'IMPORT').
    :param instance: The model instance being modified.
    :param changes: Dict containing the old and new values of changed fields.
    """
    if changes is None:
        changes = {}
        
    entity_id = str(instance.pk) if hasattr(instance, 'pk') else str(instance)
    entity_type = instance.__class__.__name__
    
    # Ensure user is authenticated, otherwise set to None
    auth_user = None
    if user and user.is_authenticated:
        auth_user = user
        
    return AuditLog.objects.create(
        user=auth_user,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        changes=changes
    )
