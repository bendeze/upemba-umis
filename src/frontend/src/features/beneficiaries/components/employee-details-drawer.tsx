'use client';

import React from 'react';
import { useEmployee, useDeleteDependent } from '../hooks/use-beneficiaries';
import { Employee, Dependent } from '../types';
import { 
  X, 
  Loader2, 
  MapPin, 
  Building2, 
  ShieldCheck, 
  Plus, 
  Trash2, 
  Calendar,
  Heart,
  Baby
} from 'lucide-react';

interface EmployeeDetailsDrawerProps {
  employeeId: string;
  onClose: () => void;
  onAddDependent: () => void;
}

export const EmployeeDetailsDrawer: React.FC<EmployeeDetailsDrawerProps> = ({ 
  employeeId, 
  onClose, 
  onAddDependent 
}) => {
  // Query
  const { data: employee, isLoading } = useEmployee(employeeId);

  // Mutation
  const deleteDependentMutation = useDeleteDependent(employeeId);

  const handleDeleteDependent = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to remove the dependent '${name}'?`)) {
      try {
        await deleteDependentMutation.mutateAsync(id);
      } catch (err: any) {
        alert(err.message || 'Failed to delete dependent.');
      }
    }
  };

  const getRelationshipIcon = (relationship: Dependent['relationship']) => {
    switch (relationship) {
      case 'SPOUSE':
        return <Heart className="h-4 w-4 text-rose-500 shrink-0" />;
      default:
        return <Baby className="h-4 w-4 text-sky-500 shrink-0" />;
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-md bg-white border-l border-slate-200 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
      
      {/* 1. Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50">
        <div>
          <h3 className="text-base font-bold text-slate-800">
            Beneficiary Register Entry
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Full record file for UMIS medical department check.
          </p>
        </div>
        <button 
          onClick={onClose}
          className="p-1 rounded-md text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {isLoading ? (
        /* --- Loading State --- */
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-10 w-10 text-teal-600 animate-spin" />
          <p className="text-slate-500 text-sm">Opening register file...</p>
        </div>
      ) : !employee ? (
        /* --- Error State --- */
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
          <p className="text-red-500 text-sm font-semibold">Failed to load register file.</p>
        </div>
      ) : (
        /* --- Details Body --- */
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* A. Bio Details Card */}
          <div className="bg-gradient-to-br from-teal-50/50 to-teal-50/10 p-5 rounded-xl border border-teal-100 space-y-3">
            <div>
              <span className="bg-teal-600 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                ID: {employee.employee_number}
              </span>
              <h2 className="text-lg font-bold text-slate-900 mt-2">
                {employee.last_name} {employee.post_name || ''} {employee.first_name}
              </h2>
            </div>
            
            <div className="space-y-2.5 text-sm text-slate-600 border-t border-teal-100/50 pt-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-slate-400 shrink-0" />
                <span>
                  Site: <strong className="text-slate-800">{employee.site_name}</strong> ({employee.region_name})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-slate-400 shrink-0" />
                <span>
                  Status: <strong className="text-slate-800 uppercase text-xs">{employee.employment_status.toLowerCase()}</strong>
                </span>
              </div>
              {employee.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>
                    Address: <span className="text-slate-700 leading-normal">{employee.address}</span>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* B. Dependents List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                Eligible Dependents ({employee.dependents?.length || 0})
              </h4>
              
              <button
                onClick={onAddDependent}
                className="flex items-center gap-1 text-teal-600 hover:text-teal-700 hover:underline text-xs font-semibold cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Dependent
              </button>
            </div>

            {!employee.dependents || employee.dependents.length === 0 ? (
              <div className="text-center p-8 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 text-xs block">No dependents registered.</span>
                <p className="text-[10px] text-slate-500 mt-1 max-w-[200px] mx-auto leading-normal">
                  Registered spouses and children are automatically eligible for health coverage.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {employee.dependents.map((dep) => (
                  <div 
                    key={dep.id} 
                    className="p-3.5 border border-slate-200 rounded-xl bg-white flex items-center justify-between hover:shadow-sm hover:border-slate-300 transition duration-150"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1 bg-slate-50 p-2 border border-slate-200 rounded-lg shrink-0">
                        {getRelationshipIcon(dep.relationship)}
                      </div>
                      <div>
                        <h5 className="font-semibold text-slate-800 text-sm leading-normal">
                          {dep.full_name}
                        </h5>
                        
                        <div className="flex items-center gap-3 text-slate-500 text-[10px] uppercase font-semibold mt-1">
                          <span>{dep.relationship}</span>
                          <span className="h-1 w-1 bg-slate-300 rounded-full" />
                          <span>{dep.gender === 'F' ? 'Female' : 'Male'}</span>
                          {dep.birth_date && (
                            <>
                              <span className="h-1 w-1 bg-slate-300 rounded-full" />
                              <span className="flex items-center gap-0.5">
                                <Calendar className="h-3 w-3" />
                                {new Date(dep.birth_date).getFullYear()}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleDeleteDependent(dep.id, dep.full_name)}
                      className="p-1 rounded text-slate-400 hover:bg-red-50 hover:text-red-600 transition shrink-0 cursor-pointer"
                      title="Remove Dependent"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
};
