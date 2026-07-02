from django.test import TestCase
from pharmacy.models import Medicine, StockMovement, PharmacyStock, MedicineBatch, MedicalCenter

class LotNumberLogicTest(TestCase):
    def setUp(self):
        self.medical_center = MedicalCenter.objects.create(name='Clinic')
        self.medicine = Medicine.objects.create(name='Paracetamol', unit='Tablet')

    def test_in_creates_batch_with_lot(self):
        StockMovement.objects.create(
            medical_center=self.medical_center,
            medicine=self.medicine,
            movement_type='IN',
            quantity=100,
            lot_number='LOT-123',
            expiration_date='2026-12-31'
        )
        batch = MedicineBatch.objects.get(lot_number='LOT-123')
        self.assertEqual(batch.quantity, 100)
        self.assertEqual(PharmacyStock.objects.get(medicine=self.medicine).quantity, 100)

    def test_out_deducts_specific_lot(self):
        StockMovement.objects.create(medical_center=self.medical_center, medicine=self.medicine, movement_type='IN', quantity=100, lot_number='LOT-A', expiration_date='2026-01-01')
        StockMovement.objects.create(medical_center=self.medical_center, medicine=self.medicine, movement_type='IN', quantity=100, lot_number='LOT-B', expiration_date='2026-12-31')

        # Deduct from LOT-B specifically
        StockMovement.objects.create(medical_center=self.medical_center, medicine=self.medicine, movement_type='OUT', quantity=50, lot_number='LOT-B')
        
        # LOT-B should be 50, LOT-A should be 100
        self.assertEqual(MedicineBatch.objects.get(lot_number='LOT-B').quantity, 50)
        self.assertEqual(MedicineBatch.objects.get(lot_number='LOT-A').quantity, 100)
        self.assertEqual(PharmacyStock.objects.get(medicine=self.medicine).quantity, 150)

    def test_out_fallback_to_fefo(self):
        StockMovement.objects.create(medical_center=self.medical_center, medicine=self.medicine, movement_type='IN', quantity=100, lot_number='LOT-A', expiration_date='2026-01-01')
        StockMovement.objects.create(medical_center=self.medical_center, medicine=self.medicine, movement_type='IN', quantity=100, lot_number='LOT-B', expiration_date='2026-12-31')

        # Deduct 150 automatically
        StockMovement.objects.create(medical_center=self.medical_center, medicine=self.medicine, movement_type='OUT', quantity=150)
        
        # LOT-A should be 0 (earliest expiring), LOT-B should be 50
        self.assertEqual(MedicineBatch.objects.get(lot_number='LOT-A').quantity, 0)
        self.assertEqual(MedicineBatch.objects.get(lot_number='LOT-B').quantity, 50)
        self.assertEqual(PharmacyStock.objects.get(medicine=self.medicine).quantity, 50)

