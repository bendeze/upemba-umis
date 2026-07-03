import React, { useEffect, useState } from 'react';
import { X, Printer, User, Calendar, Activity, Pill, Clock } from 'lucide-react';
import { Consultation } from '../types';
import { pharmacyApi } from '@/features/pharmacy/api/pharmacy-api';
import { Medicine } from '@/features/pharmacy/types';

interface Props {
  consultation: Consultation;
  onClose: () => void;
}

export function ConsultationDetailsModal({ consultation, onClose }: Props) {
  const [medicines, setMedicines] = useState<Record<string, string>>({});

  useEffect(() => {
    // Fetch medicines so we can display their names instead of just IDs
    pharmacyApi.getMedicines().then((data: Medicine[]) => {
      const medMap: Record<string, string> = {};
      data.forEach(m => {
        medMap[m.id] = m.name;
      });
      setMedicines(medMap);
    });
  }, []);

  const handlePrint = () => {
    window.print();
  };

  let patientName = consultation.external_patient_name || 'Unknown';
  if (consultation.patient_type === 'EMPLOYEE' && consultation.employee_details) {
    patientName = `${consultation.employee_details.nom || consultation.employee_details.first_name} ${consultation.employee_details.prenom || consultation.employee_details.last_name}`;
  } else if (consultation.patient_type === 'DEPENDENT' && consultation.dependent_details) {
    patientName = consultation.dependent_details.nom_complet || consultation.dependent_details.full_name;
  }

  const prescription = consultation.prescriptions && consultation.prescriptions.length > 0 
    ? consultation.prescriptions[0] 
    : null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:p-0 print:bg-white print:block">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200 print:shadow-none print:max-w-none print:max-h-none print:overflow-visible">
        
        {/* Header - Hidden on print, custom print header used instead */}
        <div className="sticky top-0 bg-white/80 backdrop-blur-md px-6 py-4 border-b border-slate-100 flex items-center justify-between z-10 print:hidden">
          <h2 className="text-xl font-bold text-slate-800">Consultation Details</h2>
          <div className="flex items-center gap-3">
            <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition">
              <Printer className="h-4 w-4" />
              Export PDF
            </button>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Print-only Header */}
        <div className="hidden print:block border-b-2 border-slate-800 pb-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Upemba Medical Center</h1>
              <p className="text-slate-500 mt-1">Official Medical Consultation Record</p>
            </div>
            <div className="text-right">
              <p className="font-medium text-slate-700">Date: {new Date(consultation.date).toLocaleDateString()}</p>
              <p className="text-slate-500">Ref: {consultation.id.substring(0, 8).toUpperCase()}</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-8">
          
          {/* Patient Info Card */}
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 print:bg-white print:border-slate-300">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <User className="h-4 w-4" />
              Patient Information
            </h3>
            <div className="grid grid-cols-2 gap-y-4 gap-x-8">
              <div>
                <p className="text-xs text-slate-500 mb-1">Full Name</p>
                <p className="font-semibold text-slate-900">{patientName}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Patient Type</p>
                <p className="font-medium text-slate-700">
                  <span className="inline-block px-2 py-0.5 bg-teal-100 text-teal-800 rounded text-xs print:bg-transparent print:p-0 print:text-slate-900">{consultation.patient_type}</span>
                </p>
              </div>
              {consultation.employee_details && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">Matricule</p>
                  <p className="font-medium text-slate-700">{consultation.employee_details.employee_number || consultation.employee_details.matricule || 'N/A'}</p>
                </div>
              )}
              {consultation.dependent_details && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">Relationship</p>
                  <p className="font-medium text-slate-700">{consultation.dependent_details.relationship}</p>
                </div>
              )}
            </div>
          </div>

          {/* Clinical Details */}
          <div>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-slate-100 pb-2 print:border-slate-300">
              <Activity className="h-4 w-4" />
              Clinical Details
            </h3>
            <div className="space-y-6">
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-2">Doctor / Clinician</p>
                <p className="text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-100 print:bg-transparent print:border-none print:p-0">
                  {consultation.doctor_name || 'Not specified'}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-2">Symptoms</p>
                <p className="text-slate-800 bg-slate-50 p-4 rounded-lg border border-slate-100 whitespace-pre-wrap print:bg-transparent print:border-none print:p-0">
                  {consultation.symptoms || 'No symptoms recorded.'}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-2">Diagnosis</p>
                <p className="text-slate-800 bg-teal-50 p-4 rounded-lg border border-teal-100 whitespace-pre-wrap print:bg-transparent print:border-none print:p-0 font-medium">
                  {consultation.diagnosis || 'No diagnosis recorded.'}
                </p>
              </div>
              {consultation.notes && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-2">Additional Notes</p>
                  <p className="text-slate-800 bg-slate-50 p-4 rounded-lg border border-slate-100 whitespace-pre-wrap print:bg-transparent print:border-none print:p-0">
                    {consultation.notes}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Prescription */}
          <div>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-slate-100 pb-2 print:border-slate-300">
              <Pill className="h-4 w-4" />
              Prescription
            </h3>
            
            {!prescription || !prescription.items || prescription.items.length === 0 ? (
              <p className="text-slate-500 italic">No prescription issued for this consultation.</p>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden print:border-slate-300">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 print:bg-slate-100 text-xs uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Medicine</th>
                      <th className="px-4 py-3 font-semibold">Qty</th>
                      <th className="px-4 py-3 font-semibold">Instructions</th>
                      <th className="px-4 py-3 font-semibold text-right print:hidden">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 print:divide-slate-200">
                    {prescription.items.map((item: any, i: number) => (
                      <tr key={i} className="text-sm">
                        <td className="px-4 py-3 font-medium text-slate-800">
                          {item.medicine?.name || medicines[item.medicine_id] || 'Unknown'}
                        </td>
                        <td className="px-4 py-3 text-slate-600 font-semibold">
                          {item.quantity_prescribed}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {item.dosage_instructions || '-'}
                        </td>
                        <td className="px-4 py-3 text-right print:hidden">
                          {item.quantity_dispensed >= item.quantity_prescribed ? (
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">Dispensed</span>
                          ) : item.quantity_dispensed > 0 ? (
                            <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs">Partial</span>
                          ) : (
                            <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs">Pending</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* Print Footer */}
        <div className="hidden print:block mt-16 pt-8 border-t border-slate-300 text-sm text-slate-500">
          <div className="flex justify-between">
            <p>Generated by Upemba Medical Information System (UMIS)</p>
            <div className="text-center">
              <div className="w-48 h-px bg-slate-800 mb-2 mx-auto"></div>
              <p>Doctor Signature / Stamp</p>
            </div>
          </div>
        </div>

      </div>

      {/* Global Print Styles to hide the rest of the app */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:block, .print\\:block * {
            visibility: visible;
          }
          .print\\:hidden {
            display: none !important;
          }
          .fixed.inset-0 {
            position: absolute;
            left: 0;
            top: 0;
            margin: 0;
            padding: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
