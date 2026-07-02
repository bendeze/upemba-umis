import uuid
from django.db import models
from core.models import TimeStampedModel

class Region(TimeStampedModel):
    """
    Region of operations (e.g., Lubumbashi, Park Headquarters).
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, unique=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class Site(TimeStampedModel):
    """
    Operational healthcare facility or work site inside a region.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    region = models.ForeignKey(Region, on_delete=models.SET_NULL, null=True, blank=True, related_name='sites')
    name = models.CharField(max_length=255)

    class Meta:
        ordering = ['name']
        constraints = [
            models.UniqueConstraint(fields=['name', 'region'], name='unique_site_per_region')
        ]

    def __str__(self):
        return f"{self.name} ({self.region.name if self.region else 'No Region'})"
