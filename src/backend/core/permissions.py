from rest_framework import permissions
from core.utils.signature import verify_signed_url

class HasValidSignature(permissions.BasePermission):
    """
    Permission class that grants access if the request URL
    contains a valid HMAC signature.
    """
    
    def has_permission(self, request, view):
        return verify_signed_url(request)
