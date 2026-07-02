import hmac
import hashlib
import time
from django.conf import settings

def generate_signed_url(path: str, expires_in_seconds: int = 3600) -> str:
    """
    Generate an HMAC signed URL for the given path.
    The path should NOT include query parameters initially, as they will be appended.
    """
    expires = int(time.time()) + expires_in_seconds
    
    # Message format to sign: "path::expires"
    message = f"{path}::{expires}"
    
    signature = hmac.new(
        settings.SECRET_KEY.encode('utf-8'),
        message.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    
    # Append the query params to the path
    separator = '&' if '?' in path else '?'
    signed_url = f"{path}{separator}expires={expires}&signature={signature}"
    return signed_url

def verify_signed_url(request) -> bool:
    """
    Verify if the request contains a valid HMAC signature.
    """
    expires = request.query_params.get('expires')
    signature = request.query_params.get('signature')
    
    if not expires or not signature:
        return False
        
    try:
        expires_int = int(expires)
    except ValueError:
        return False
        
    if expires_int < time.time():
        return False # Expired
        
    # The path to reconstruct the message should be the request.path without the query string
    path = request.path
    message = f"{path}::{expires}"
    
    expected_signature = hmac.new(
        settings.SECRET_KEY.encode('utf-8'),
        message.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(expected_signature, signature)
