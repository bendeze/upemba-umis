'use client';

import React from 'react';
import { 
  useEmployees, 
  useRegions, 
  useSites, 
  useDeleteEmployee 
} from '../hooks/use-beneficiaries';
import { useBeneficiariesStore } from '../store/use-beneficiaries-store';
import { Employee, EmploymentStatus } from '../types';
import { 
  Search, 
  Filter, 
  RotateCcw, 
  Plus, 
  FileSpreadsheet, 
  ChevronLeft, 
  ChevronRight, 
  Edit, 
  Trash2, 
  Eye,
  Loader2,
  Users
} from 'lucide-react';

interface EmployeeTableProps {
  onViewDetails: (employee: Employee) => void;
  onEdit: (employee: Employee) => void;
}

export const EmployeeTable: React.FC<EmployeeTableProps> = ({ onViewDetails, onEdit }) => {
  const queryClient = useBeneficiariesStore();
  
  // Connect store states
  const { 
    search, setSearch,
    regionId, setRegionId,
    siteId, setSiteId,
    status, setStatus,
    page, setPage,
    setCreateOpen,
    setImportOpen,
    resetFilters
  } = useBeneficiariesStore();

  // Queries
  const { data: regions } = useRegions();
  const { data: sites } = useSites(regionId || undefined);
  const { data: empData, isLoading, isPlaceholderData } = useEmployees({
    page,
    search,
    regionId,
    siteId,
    status
  });

  // Mutations
  const deleteEmployeeMutation = useDeleteEmployee();

  const handlePageChange = (newPage: number) => {
    if (newPage < 1) return;
    if (empData && !empData.next && newPage > page) return;
    setPage(newPage);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to soft-delete the employee '${name}'? All clinical histories will be safeguarded.`)) {
      try {
        await deleteEmployeeMutation.mutateAsync(id);
      } catch (err: any) {
        alert(err.message || 'Failed to delete employee.');
      }
    }
  };

  const getStatusBadgeClass = (status: EmploymentStatus) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'INACTIVE':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      case 'SUSPENDED':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'RETIRED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-50 text-slate-500 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Control Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm glass">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
            <Users className="h-5 w-5 text-teal-600" />
            Beneficiaries Directory
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Manage Upemba National Park staff and their eligible dependents.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setImportOpen(true)}
            className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 bg-white hover:bg-slate-50 font-medium text-sm transition shadow-sm cursor-pointer"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            Import Excel
          </button>
          
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white bg-teal-600 hover:bg-teal-700 font-medium text-sm transition shadow-sm cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Add Employee
          </button>
        </div>
      </div>

      {/* 2. Visual Filtering Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
          />
        </div>

        {/* Region */}
        <div className="relative">
          <select
            value={regionId}
            onChange={(e) => setRegionId(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition appearance-none cursor-pointer"
          >
            <option value="">All Regions</option>
            {regions?.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>

        {/* Site */}
        <div className="relative">
          <select
            value={siteId}
            onChange={(e) => setSiteId(e.target.value)}
            disabled={!regionId}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition appearance-none disabled:opacity-50 cursor-pointer"
          >
            <option value="">All Sites</option>
            {sites?.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div className="relative">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition appearance-none cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="RETIRED">Retired</option>
          </select>
        </div>

        {/* Reset */}
        <button
          onClick={resetFilters}
          className="flex items-center justify-center gap-2 px-3 py-2 border border-slate-300 rounded-lg text-slate-700 bg-white hover:bg-slate-50 font-medium text-sm transition cursor-pointer"
        >
          <RotateCcw className="h-4 w-4" />
          Reset Filters
        </button>
      </div>

      {/* 3. Main Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-10 w-10 text-teal-600 animate-spin" />
            <p className="text-slate-500 text-sm">Retrieving employee registers...</p>
          </div>
        ) : !empData || empData.results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <Users className="h-12 w-12 text-slate-300 mb-3" />
            <h3 className="text-base font-bold text-slate-800">No Employees Found</h3>
            <p className="text-slate-500 text-sm max-w-xs mt-1">
              No employee matches current filter filters. Try clearing inputs or uploading a roster.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                  <th className="px-6 py-4">Employee Number</th>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Region / Site</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Dependents</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {empData.results.map((emp) => (
                  <tr 
                    key={emp.id} 
                    className={`hover:bg-slate-50/50 transition cursor-pointer ${isPlaceholderData ? 'opacity-70' : ''}`}
                    onClick={() => onViewDetails(emp)}
                  >
                    <td className="px-6 py-4 font-mono font-medium text-slate-800">
                      {emp.employee_number}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">
                        {emp.last_name} {emp.post_name || ''}
                      </div>
                      <div className="text-slate-500 text-xs">{emp.first_name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-700">{emp.region_name}</div>
                      <div className="text-slate-500 text-xs">{emp.site_name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadgeClass(emp.employment_status)}`}>
                        {emp.employment_status.toLowerCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">
                      <span className="bg-teal-50 text-teal-700 px-2 py-0.5 rounded border border-teal-100 font-mono text-xs">
                        {emp.dependents?.length || 0} ayants droits
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onViewDetails(emp)}
                          className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onEdit(emp)}
                          className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 hover:text-teal-600 transition cursor-pointer"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(emp.id, `${emp.last_name} ${emp.first_name}`)}
                          className="p-1.5 rounded-md text-slate-500 hover:bg-red-50 hover:text-red-600 transition cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. Table Pagination Footer */}
        {empData && empData.count > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
            <div className="text-slate-500 text-xs">
              Showing page <span className="font-semibold text-slate-700">{page}</span> | Total <span className="font-semibold text-slate-700">{empData.count}</span> records
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1 || isLoading}
                className="flex items-center gap-1 px-3 py-1.5 border border-slate-300 rounded bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 text-xs font-medium transition cursor-pointer"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Previous
              </button>
              
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={!empData.next || isLoading}
                className="flex items-center gap-1 px-3 py-1.5 border border-slate-300 rounded bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 text-xs font-medium transition cursor-pointer"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
