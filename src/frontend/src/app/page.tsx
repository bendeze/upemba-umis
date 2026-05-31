'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/features/beneficiaries/services/api';
import { useBeneficiariesStore } from '@/features/beneficiaries/store/use-beneficiaries-store';
import { EmployeeTable } from '@/features/beneficiaries/components/employee-table';
import { EmployeeForm } from '@/features/beneficiaries/components/employee-form';
import { DependentDialog } from '@/features/beneficiaries/components/dependent-dialog';
import { ImportExcelDialog } from '@/features/beneficiaries/components/import-excel-dialog';
import { EmployeeDetailsDrawer } from '@/features/beneficiaries/components/employee-details-drawer';
import { useEmployees, useRegions } from '@/features/beneficiaries/hooks/use-beneficiaries';
import { Employee } from '@/features/beneficiaries/types';
import { 
  Building2, 
  Users, 
  ShieldAlert, 
  LogOut, 
  LayoutDashboard, 
  FolderGit, 
  Activity, 
  Pill, 
  ClipboardList,  
  UserCheck, 
  Stethoscope, 
  Lock, 
  User, 
  TrendingUp 
} from 'lucide-react';

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [checkingAuth, setCheckingAuth] = useState<boolean>(true);
  
  // Auth Form Credentials
  const [username, setUsername] = useState<string>('admin');
  const [password, setPassword] = useState<string>('adminpassword');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // Zustand Store States
  const {
    selectedEmployeeId, setSelectedEmployeeId,
    isImportOpen, setImportOpen,
    isCreateOpen, setCreateOpen,
    isEditOpen, setEditOpen,
    isAddDependentOpen, setAddDependentOpen
  } = useBeneficiariesStore();

  const [activeEditEmployee, setActiveEditEmployee] = useState<Employee | null>(null);
  const [activeDetailEmployee, setActiveDetailEmployee] = useState<Employee | null>(null);

  // Fetch count statistics (from cached react-query responses)
  const { data: regions } = useRegions();
  const { data: empData } = useEmployees({ page: 1, search: '', regionId: '', siteId: '', status: '' });

  useEffect(() => {
    // Check initial auth status
    setIsLoggedIn(api.isAuthenticated());
    setCheckingAuth(false);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);
    try {
      await api.login(username, password);
      setIsLoggedIn(true);
    } catch (err: any) {
      setLoginError(err.message || 'Login failed. Verify server is running and credentials are correct.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    api.logout();
    setIsLoggedIn(false);
    setSelectedEmployeeId(null);
  };

  const handleOpenDetails = (employee: Employee) => {
    setSelectedEmployeeId(employee.id);
    setActiveDetailEmployee(employee);
  };

  const handleOpenEdit = (employee: Employee) => {
    setActiveEditEmployee(employee);
    setEditOpen(true);
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <LoaderIcon className="h-8 w-8 text-teal-500 animate-spin" />
      </div>
    );
  }

  if (!isLoggedIn) {
    /* --- BEAUTIFUL JWT LOGIN SCREEN --- */
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950">
        <div className="w-full max-w-md bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 bg-teal-500/20 border border-teal-500/30 rounded-2xl mb-2">
              <Stethoscope className="h-8 w-8 text-teal-400" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">UMIS Portal</h1>
            <p className="text-sm text-slate-300">
              Upemba Medical Information System
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. admin"
                  className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter access code"
                  className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
                />
              </div>
            </div>

            {loginError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-300 leading-normal flex items-start gap-2">
                <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-white bg-teal-600 hover:bg-teal-700 font-semibold text-sm transition shadow-md disabled:opacity-50 cursor-pointer"
            >
              {isLoggingIn ? (
                <>
                  <LoaderIcon className="h-4 w-4 animate-spin" />
                  Authorizing access...
                </>
              ) : (
                'Open Secure Connection'
              )}
            </button>
          </form>

          <div className="border-t border-white/10 pt-4 text-center">
            <p className="text-[10px] text-slate-400 leading-normal">
              This terminal is restricted to authorized medical personnel of Upemba National Park. All sessions are audited.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Count metrics calculations
  const totalEmployees = empData?.count || 0;
  const regionsCount = regions?.length || 0;
  
  // Quick summation of ayants droits registered across initial fetched employees list
  const totalAyantsDroits = empData?.results.reduce((acc, emp) => acc + (emp.dependents?.length || 0), 0) || 0;

  /* --- SECURE ENTERPRISE DASHBOARD VIEW --- */
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      
      {/* 1. Sleek Left Sidebar Navigation */}
      <aside className="w-64 h-full bg-slate-900 text-slate-400 flex flex-col border-r border-slate-800 shrink-0 overflow-y-auto">
        {/* Brand logo container */}
        <div className="flex items-center gap-2.5 px-6 py-5 border-b border-slate-800">
          <div className="bg-primary p-1.5 rounded-lg text-white">
            <Stethoscope className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-wide leading-none">UMIS Platform</h1>
            <span className="text-[9px] uppercase tracking-widest font-semibold text-primary">Medical Dept</span>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 text-sm">
          <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/10 text-primary font-medium transition">
            <LayoutDashboard className="h-4 w-4" />
            Beneficiaries
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 hover:text-white transition opacity-60 cursor-not-allowed" title="Future consultations module">
            <Activity className="h-4 w-4" />
            Consultations
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 hover:text-white transition opacity-60 cursor-not-allowed" title="Future pharmacy module">
            <Pill className="h-4 w-4" />
            Pharmacy
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 hover:text-white transition opacity-60 cursor-not-allowed" title="Future laboratory module">
            <ClipboardList className="h-4 w-4" />
            Laboratory
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 hover:text-white transition opacity-60 cursor-not-allowed" title="Future reporting module">
            <FolderGit className="h-4 w-4" />
            Reporting Analytics
          </a>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-slate-800 p-1.5 rounded-full">
              <User className="h-3.5 w-3.5 text-primary" />
            </div>
            <div>
              <span className="block text-xs font-semibold text-white leading-none">Admin</span>
              <span className="text-[9px] uppercase tracking-wider text-slate-500">Superuser</span>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-md hover:bg-slate-800 text-slate-500 hover:text-red-400 transition cursor-pointer"
            title="Log Out Session"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {/* 2. Main Layout Workspace */}
      <main className="flex-1 h-full flex flex-col min-w-0 overflow-hidden">
        
        {/* Top welcome layout header */}
        <header className="h-16 border-b border-slate-200 bg-white px-8 flex items-center justify-between shrink-0">
          <div className="text-sm font-medium text-slate-600">
            Current Date/Time: <span className="font-semibold text-slate-800">May 31, 2026</span>
          </div>
          
          <div className="flex items-center gap-2.5 text-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium text-slate-700">Central Database Online</span>
          </div>
        </header>

        {/* Scrollable page body */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          
          {/* Overview analytics metrics grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Card 1 */}
            <div className="bg-white p-5 border border-border rounded-xl shadow-sm flex items-start gap-4 hover:shadow-md transition">
              <div className="bg-accent/40 p-3 border border-accent rounded-xl text-primary">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Agents</span>
                <span className="block text-2xl font-bold text-slate-800 mt-1">{totalEmployees}</span>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white p-5 border border-border rounded-xl shadow-sm flex items-start gap-4 hover:shadow-md transition">
              <div className="bg-secondary/40 p-3 border border-secondary rounded-xl text-secondary-foreground">
                <UserCheck className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ayants Droits</span>
                <span className="block text-2xl font-bold text-slate-800 mt-1">{totalAyantsDroits}+</span>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white p-5 border border-border rounded-xl shadow-sm flex items-start gap-4 hover:shadow-md transition">
              <div className="bg-muted p-3 border border-border rounded-xl text-muted-foreground">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Regions</span>
                <span className="block text-2xl font-bold text-slate-800 mt-1">{regionsCount}</span>
              </div>
            </div>

            {/* Card 4 */}
            <div className="bg-white p-5 border border-border rounded-xl shadow-sm flex items-start gap-4 hover:shadow-md transition">
              <div className="bg-primary/10 p-3 border border-primary/20 rounded-xl text-primary">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Family Coverage</span>
                <span className="block text-2xl font-bold text-slate-800 mt-1">100%</span>
              </div>
            </div>
          </div>

          {/* Roster management table */}
          <EmployeeTable 
            onViewDetails={handleOpenDetails} 
            onEdit={handleOpenEdit} 
          />
        </div>
      </main>

      {/* 3. Sliding Detail Drawer Side Panel */}
      {selectedEmployeeId && activeDetailEmployee && (
        <EmployeeDetailsDrawer
          employeeId={selectedEmployeeId}
          onClose={() => { setSelectedEmployeeId(null); setActiveDetailEmployee(null); }}
          onAddDependent={() => setAddDependentOpen(true)}
        />
      )}

      {/* 4. Overlay Modals */}
      {/* Create Employee Form */}
      {isCreateOpen && (
        <EmployeeForm onClose={() => setCreateOpen(false)} />
      )}

      {/* Edit Employee Form */}
      {isEditOpen && activeEditEmployee && (
        <EmployeeForm 
          employee={activeEditEmployee} 
          onClose={() => { setCreateOpen(false); setEditOpen(false); setActiveEditEmployee(null); }} 
        />
      )}

      {/* Add Dependent modal */}
      {isAddDependentOpen && selectedEmployeeId && activeDetailEmployee && (
        <DependentDialog
          employeeId={selectedEmployeeId}
          employeeName={`${activeDetailEmployee.last_name} ${activeDetailEmployee.first_name}`}
          onClose={() => setAddDependentOpen(false)}
        />
      )}

      {/* Bulk Excel Ingestion modal */}
      {isImportOpen && (
        <ImportExcelDialog onClose={() => setImportOpen(false)} />
      )}

    </div>
  );
}

// Micro loader component
function LoaderIcon({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24"
    >
      <circle 
        className="opacity-25" 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        strokeWidth="4"
      />
      <path 
        className="opacity-75" 
        fill="currentColor" 
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
