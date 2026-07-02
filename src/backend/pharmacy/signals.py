from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db.models import F
from .models import StockMovement, PharmacyStock, MedicineBatch

@receiver(post_save, sender=StockMovement)
def update_stock_on_movement(sender, instance, created, **kwargs):
    if not created:
        return
        
    if instance.movement_type == 'HISTORICAL_OUT':
        return
    
    # 1. Update overall PharmacyStock
    stock, _ = PharmacyStock.objects.get_or_create(
        medical_center=instance.medical_center,
        medicine=instance.medicine,
        defaults={'quantity': 0}
    )

    if instance.movement_type == 'IN':
        stock.quantity += instance.quantity
        stock.save()

        # Update or create MedicineBatch
        lot = instance.lot_number if instance.lot_number else 'UNKNOWN'
        batch, _ = MedicineBatch.objects.get_or_create(
            medical_center=instance.medical_center,
            medicine=instance.medicine,
            lot_number=lot,
            defaults={'quantity': 0, 'expiration_date': instance.expiration_date}
        )
        batch.quantity += instance.quantity
        # Update expiration date if it was originally null but now provided
        if not batch.expiration_date and instance.expiration_date:
            batch.expiration_date = instance.expiration_date
        batch.save()
            
    elif instance.movement_type in ['OUT', 'ADJUST']:
        stock.quantity -= instance.quantity
        stock.save()

        remaining_to_deduct = instance.quantity

        # 1. If a specific lot number was chosen, deduct from it first
        if instance.lot_number:
            try:
                specific_batch = MedicineBatch.objects.get(
                    medical_center=instance.medical_center,
                    medicine=instance.medicine,
                    lot_number=instance.lot_number
                )
                if specific_batch.quantity >= remaining_to_deduct:
                    specific_batch.quantity -= remaining_to_deduct
                    specific_batch.save()
                    remaining_to_deduct = 0
                else:
                    remaining_to_deduct -= specific_batch.quantity
                    specific_batch.quantity = 0
                    specific_batch.save()
            except MedicineBatch.DoesNotExist:
                pass # Fall back to FEFO if batch not found

        # 2. FIFO/FEFO deduction from remaining batches (if any quantity still needs deducting)
        if remaining_to_deduct > 0:
            batches = MedicineBatch.objects.filter(
                medical_center=instance.medical_center, 
                medicine=instance.medicine, 
                quantity__gt=0
            ).order_by('expiration_date') # earliest expiring first

            for batch in batches:
                if remaining_to_deduct <= 0:
                    break
                
                if batch.quantity >= remaining_to_deduct:
                    batch.quantity -= remaining_to_deduct
                    batch.save()
                    remaining_to_deduct = 0
                else:
                    remaining_to_deduct -= batch.quantity
                    batch.quantity = 0
                    batch.save()
