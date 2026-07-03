import React, { useState, useEffect } from 'react';
import { MedicalCenter, Medicine } from '../types';
import { pharmacyApi } from '../api/pharmacy-api';
import { X, Plus, Trash } from 'lucide-react';
import { useTranslation } from '@/features/i18n/store/use-i18n-store';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  medicalCenters: MedicalCenter[];
  medicines: Medicine[];
  selectedMedicalCenterId: string;
}

export function CreatePrescriptionForm({ isOpen, onClose, onSuccess, medicalCenters, medicines, selectedMedicalCenterId }: Props) {
  const { t } = useTranslation();
  
  const [medicalCenterId, setMedicalCenterId] = useState(selectedMedicalCenterId);
  const [patientType, setPatientType] = useState<'EMPLOYEE' | 'DEPENDENT' | 'EXTERNAL'>('EXTERNAL');
  const [patientName, setPatientName] = useState('');
  const [prescribingDoctor, setPrescribingDoctor] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  
  const [items, setItems] = useState<{ medicine_id: string; quantity_prescribed: number; dosage_instructions: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMedicalCenterId(selectedMedicalCenterId || (medicalCenters[0]?.id ?? ''));
      setPatientType('EXTERNAL');
      setPatientName('');
      setPrescribingDoctor('');
      setDiagnosis('');
      setItems([{ medicine_id: '', quantity_prescribed: 1, dosage_instructions: '' }]);
      setError(null);
    }
  }, [isOpen, selectedMedicalCenterId, medicalCenters]);

  if (!isOpen) return null;

  const handleAddItem = () => {
    setItems([...items, { medicine_id: '', quantity_prescribed: 1, dosage_instructions: '' }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!medicalCenterId) {
      setError("Please select a medical center.");
      return;
    }
    
    const validItems = items.filter(i => i.medicine_id && i.quantity_prescribed > 0);
    if (validItems.length === 0) {
      setError("Please add at least one valid medicine to the prescription.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const payload: any = {
        medical_center_id: medicalCenterId,
        patient_type: patientType,
        prescribing_doctor: prescribingDoctor,
        diagnosis,
        items: validItems
      };
      
      if (patientType === 'EXTERNAL') {
        payload.external_patient_name = patientName;
      }
      
      await pharmacyApi.createPrescription(payload);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create prescription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">New Prescription</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Medical Center</label>
                <select
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  value={medicalCenterId}
                  onChange={(e) => setMedicalCenterId(e.target.value)}
                >
                  <option value="">Select Center</option>
                  {medicalCenters.map(mc => (
                    <option key={mc.id} value={mc.id}>{mc.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Patient Type</label>
                <select
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  value={patientType}
                  onChange={(e) => setPatientType(e.target.value as any)}
                >
                  <option value="EXTERNAL">External / Villager</option>
                  <option value="EMPLOYEE">Employee (Coming soon)</option>
                  <option value="DEPENDENT">Dependent (Coming soon)</option>
                </select>
              </div>

              {patientType === 'EXTERNAL' && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Patient Name</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="Enter patient name"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Prescribing Doctor</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  value={prescribingDoctor}
                  onChange={(e) => setPrescribingDoctor(e.target.value)}
                  placeholder="Dr. Name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Diagnosis</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="e.g. Malaria"
                />
              </div>
            </div>

            <div className="border-t border-slate-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-800">Prescribed Medicines</h3>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="flex items-center gap-2 text-sm text-teal-600 hover:text-teal-700 font-medium"
                >
                  <Plus className="h-4 w-4" />
                  Add Medicine
                </button>
              </div>

              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={index} className="flex flex-col md:flex-row gap-3 items-start md:items-end bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <div className="flex-1 w-full">
                      <label className="block text-xs font-medium text-slate-500 mb-1">Medicine</label>
                      <select
                        required
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        value={item.medicine_id}
                        onChange={(e) => handleItemChange(index, 'medicine_id', e.target.value)}
                      >
                        <option value="">Select Medicine</option>
                        {medicines.map(m => (
                          <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>
                        ))}
                      </select>
                    </div>
                    <div className="w-full md:w-24">
                      <label className="block text-xs font-medium text-slate-500 mb-1">Qty</label>
                      <input
                        type="number"
                        min="1"
                        required
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        value={item.quantity_prescribed}
                        onChange={(e) => handleItemChange(index, 'quantity_prescribed', parseInt(e.target.value))}
                      />
                    </div>
                    <div className="flex-1 w-full">
                      <label className="block text-xs font-medium text-slate-500 mb-1">Dosage</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        placeholder="e.g. 1 tab x 3 times a day"
                        value={item.dosage_instructions}
                        onChange={(e) => handleItemChange(index, 'dosage_instructions', e.target.value)}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      disabled={items.length === 1}
                    >
                      <Trash className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>
          
          <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-xl">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium disabled:opacity-50 transition"
            >
              {loading ? 'Saving...' : 'Save Prescription'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
