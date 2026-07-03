import React, { useEffect, useState } from 'react';
import { pharmacyApi } from '../api/pharmacy-api';
import { Prescription, MedicalCenter, Medicine } from '../types';
import { Stethoscope, Plus, Search, Filter, CheckCircle, Clock } from 'lucide-react';
import { useTranslation } from '@/features/i18n/store/use-i18n-store';
import { CreatePrescriptionForm } from './create-prescription-form';
import { DispenseModal } from './dispense-modal';

export function PrescriptionsView() {
  const { t } = useTranslation();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [medicalCenters, setMedicalCenters] = useState<MedicalCenter[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedMedicalCenter, setSelectedMedicalCenter] = useState('');
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (medicalCenters.length > 0) {
      fetchPrescriptions();
    }
  }, [selectedMedicalCenter, statusFilter, medicalCenters]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [centers, meds] = await Promise.all([
        pharmacyApi.getMedicalCenters(),
        pharmacyApi.getMedicines()
      ]);
      setMedicalCenters(centers);
      setMedicines(meds);
      if (centers.length > 0) {
        setSelectedMedicalCenter(centers[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const data = await pharmacyApi.getPrescriptions(selectedMedicalCenter, statusFilter);
      setPrescriptions(data);
    } catch (error) {
      console.error('Failed to fetch prescriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-2.5 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded-full flex items-center gap-1"><Clock className="w-3 h-3"/> Pending</span>;
      case 'PARTIAL':
        return <span className="px-2.5 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">Partial</span>;
      case 'COMPLETED':
        return <span className="px-2.5 py-1 text-xs font-medium bg-emerald-100 text-emerald-800 rounded-full flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Completed</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Cancelled</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-medium bg-slate-100 text-slate-800 rounded-full">{status}</span>;
    }
  };

  const filteredPrescriptions = prescriptions.filter(p => {
    const patientName = (p.external_patient_name || (p.employee && p.employee.nom) || '').toLowerCase();
    const doc = (p.prescribing_doctor || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return patientName.includes(query) || doc.includes(query);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-slate-200">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
              placeholder="Search patient or doctor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              className="border-slate-300 rounded-md text-sm py-2 pl-3 pr-8 focus:ring-teal-500 focus:border-teal-500"
              value={selectedMedicalCenter}
              onChange={(e) => setSelectedMedicalCenter(e.target.value)}
            >
              {medicalCenters.map(mc => (
                <option key={mc.id} value={mc.id}>{mc.name}</option>
              ))}
            </select>
            <Filter className="h-4 w-4 text-slate-400 ml-2" />
            <select
              className="border-slate-300 rounded-md text-sm py-2 pl-3 pr-8 focus:ring-teal-500 focus:border-teal-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="PARTIAL">Partially Dispensed</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition font-medium w-full sm:w-auto justify-center"
        >
          <Plus className="h-5 w-5" />
          New Prescription
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Patient</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Doctor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Medicines</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex justify-center mb-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600"></div>
                    </div>
                    Loading prescriptions...
                  </td>
                </tr>
              ) : filteredPrescriptions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No prescriptions found.
                  </td>
                </tr>
              ) : (
                filteredPrescriptions.map((prescription) => (
                  <tr key={prescription.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                      {new Date(prescription.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">
                        {prescription.external_patient_name || (prescription.employee && prescription.employee.nom) || 'Unknown'}
                      </div>
                      <div className="text-xs text-slate-500">
                        {prescription.patient_type}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {prescription.prescribing_doctor || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(prescription.status)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      <ul className="list-disc pl-4 space-y-1">
                        {prescription.items.map(item => (
                          <li key={item.id}>
                            {item.medicine.name} <span className="text-xs text-slate-400">({item.quantity_dispensed}/{item.quantity_prescribed})</span>
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {(prescription.status === 'PENDING' || prescription.status === 'PARTIAL') && (
                        <button 
                          onClick={() => setSelectedPrescription(prescription)}
                          className="text-teal-600 hover:text-teal-900 bg-teal-50 px-3 py-1.5 rounded-md hover:bg-teal-100 transition"
                        >
                          Dispense
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CreatePrescriptionForm
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={fetchPrescriptions}
        medicalCenters={medicalCenters}
        medicines={medicines}
        selectedMedicalCenterId={selectedMedicalCenter}
      />

      <DispenseModal
        isOpen={!!selectedPrescription}
        onClose={() => setSelectedPrescription(null)}
        onSuccess={fetchPrescriptions}
        prescription={selectedPrescription}
      />
    </div>
  );
}
