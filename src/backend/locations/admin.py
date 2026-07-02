from django.contrib import admin
from locations.models import Region, Site

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
