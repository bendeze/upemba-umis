from django.db import models
from django.utils import timezone

class TimeStampedModel(models.Model):
    """
    An abstract base class model that provides self-updating
    'created_at' and 'updated_at' fields.
    """
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class SoftDeleteQuerySet(models.QuerySet):
    def delete(self):
        """Perform soft delete on queryset elements."""
        return super().update(is_deleted=True, deleted_at=timezone.now())

    def hard_delete(self):
        """Actually delete the records from the database."""
        return super().delete()

    def alive(self):
        """Return only records that have not been soft deleted."""
        return self.filter(is_deleted=False)

    def dead(self):
        """Return only records that have been soft deleted."""
        return self.filter(is_deleted=True)


class SoftDeleteManager(models.Manager):
    def get_queryset(self):
        return SoftDeleteQuerySet(self.model, using=self._db).alive()

    def all_with_deleted(self):
        """Return all records, including soft-deleted ones."""
        return SoftDeleteQuerySet(self.model, using=self._db)

    def deleted_records(self):
        """Return only soft-deleted records."""
        return SoftDeleteQuerySet(self.model, using=self._db).dead()


class SoftDeleteModel(models.Model):
    """
    An abstract base class model that supports soft deletion.
    """
    is_deleted = models.BooleanField(default=False, db_index=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    objects = SoftDeleteManager()
    all_objects = models.Manager()  # Default Django manager that returns everything

    class Meta:
        abstract = True

    def delete(self, using=None, keep_parents=False):
        """Soft delete the model instance."""
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save(update_fields=['is_deleted', 'deleted_at'])

    def restore(self):
        """Restore a soft-deleted instance."""
        self.is_deleted = False
        self.deleted_at = None
        self.save(update_fields=['is_deleted', 'deleted_at'])
