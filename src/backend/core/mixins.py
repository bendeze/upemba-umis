import hashlib
from django.core.cache import cache
from rest_framework.response import Response

def get_model_cache_version_key(model_class):
    return f"{model_class._meta.app_label}_{model_class._meta.model_name}_version"

def invalidate_model_cache(model_class):
    version_key = get_model_cache_version_key(model_class)
    current_version = cache.get(version_key, 0)
    cache.set(version_key, current_version + 1, timeout=None)

class AutoInvalidateCacheMixin:
    """
    A mixin for DRF ViewSets that caches the `list` and `retrieve` responses.
    Automatically invalidates the cache when `create`, `update`, or `destroy` is called
    by incrementing a version key associated with the model.
    """
    
    def _get_cache_version(self):
        model_class = self.get_queryset().model
        version_key = get_model_cache_version_key(model_class)
        version = cache.get(version_key)
        if version is None:
            version = 1
            cache.set(version_key, version, timeout=None)
        return version
        
    def _get_cache_key(self, request, view_action):
        model_class = self.get_queryset().model
        version = self._get_cache_version()
        
        # Create a unique key based on URL and query params
        query_string = request.META.get('QUERY_STRING', '')
        path = request.path
        
        unique_string = f"{path}?{query_string}"
        hash_md5 = hashlib.md5(unique_string.encode('utf-8')).hexdigest()
        
        return f"{model_class._meta.app_label}_{model_class._meta.model_name}_v{version}_{view_action}_{hash_md5}"

    def list(self, request, *args, **kwargs):
        cache_key = self._get_cache_key(request, 'list')
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return Response(cached_data)
            
        response = super().list(request, *args, **kwargs)
        cache.set(cache_key, response.data, timeout=60*60*24) # Cache for 24 hours
        return response

    def retrieve(self, request, *args, **kwargs):
        cache_key = self._get_cache_key(request, f'retrieve_{kwargs.get("pk")}')
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return Response(cached_data)
            
        response = super().retrieve(request, *args, **kwargs)
        cache.set(cache_key, response.data, timeout=60*60*24)
        return response

    def perform_create(self, serializer):
        super().perform_create(serializer)
        invalidate_model_cache(self.get_queryset().model)

    def perform_update(self, serializer):
        super().perform_update(serializer)
        invalidate_model_cache(self.get_queryset().model)

    def perform_destroy(self, instance):
        super().perform_destroy(instance)
        invalidate_model_cache(self.get_queryset().model)
