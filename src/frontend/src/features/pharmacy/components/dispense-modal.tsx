import React, { useState } from 'react';
import { Prescription } from '../types';
import { pharmacyApi } from '../api/pharmacy-api';
import { X, CheckCircle, AlertTriangle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  prescription: Prescription | null;
}

export function DispenseModal({ isOpen, onClose, onSuccess, prescription }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !prescription) return null;

  const pendingItems = prescription.items.filter(i => i.quantity_prescribed > i.quantity_dispensed);

  const handleDispense = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const itemsToDispense: { [key: string]: number } = {};
      pendingItems.forEach(item => {
        itemsToDispense[item.id] = item.quantity_prescribed - item.quantity_dispensed;
      });

      await pharmacyApi.dispensePrescription(prescription.id, itemsToDispense);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to dispense prescription');
    } finally {
      setLoading(false);
    }
  };

  const patientName = prescription.external_patient_name || (prescription.employee ? prescription.employee.nom : 'Unknown Patient');

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-teal-600" />
            <h2 className="text-xl font-bold text-slate-800">Dispense Prescription</h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              {error}
            </div>
          )}

          <div className="mb-6">
            <p className="text-sm text-slate-500 mb-1">Patient</p>
            <p className="font-semibold text-slate-800 text-lg">{patientName}</p>
            <p className="text-sm text-slate-500 mt-1">Doctor: {prescription.prescribing_doctor || 'N/A'}</p>
          </div>

          <h3 className="font-semibold text-slate-700 mb-3">Items to Dispense:</h3>
          <div className="space-y-3">
            {pendingItems.length === 0 ? (
              <p className="text-slate-500 italic">No pending items to dispense.</p>
            ) : (
              pendingItems.map(item => {
                const qtyToDispense = item.quantity_prescribed - item.quantity_dispensed;
                return (
                  <div key={item.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div>
                      <p className="font-medium text-slate-800">{item.medicine.name}</p>
                      <p className="text-xs text-slate-500">{item.dosage_instructions}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-teal-700">{qtyToDispense} {item.medicine.unit}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          
          <div className="mt-4 p-3 bg-teal-50 rounded-lg text-sm text-teal-800 border border-teal-100 flex gap-2">
            <AlertTriangle className="h-5 w-5 text-teal-600 flex-shrink-0" />
            <p>Confirming will automatically deduct these quantities from the current stock using FEFO (First Expired, First Out) methodology.</p>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 font-medium transition"
          >
            Cancel
          </button>
          <button
            onClick={handleDispense}
            disabled={loading || pendingItems.length === 0}
            className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium disabled:opacity-50 transition shadow-sm"
          >
            {loading ? 'Processing...' : 'Confirm Dispensation'}
          </button>
        </div>
      </div>
    </div>
  );
}
