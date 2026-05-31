import { create } from 'zustand';

interface BeneficiariesUIState {
  // Search & Filters
  search: string;
  regionId: string;
  siteId: string;
  status: string;
  page: number;
  
  // Selected Entity
  selectedEmployeeId: string | null;
  
  // Modals & Panels open status
  isImportOpen: boolean;
  isCreateOpen: boolean;
  isEditOpen: boolean;
  isAddDependentOpen: boolean;

  // Actions
  setSearch: (search: string) => void;
  setRegionId: (regionId: string) => void;
  setSiteId: (siteId: string) => void;
  setStatus: (status: string) => void;
  setPage: (page: number) => void;
  setSelectedEmployeeId: (id: string | null) => void;
  
  setImportOpen: (open: boolean) => void;
  setCreateOpen: (open: boolean) => void;
  setEditOpen: (open: boolean) => void;
  setAddDependentOpen: (open: boolean) => void;
  
  resetFilters: () => void;
}

export const useBeneficiariesStore = create<BeneficiariesUIState>((set) => ({
  search: '',
  regionId: '',
  siteId: '',
  status: '',
  page: 1,
  
  selectedEmployeeId: null,
  
  isImportOpen: false,
  isCreateOpen: false,
  isEditOpen: false,
  isAddDependentOpen: false,

  setSearch: (search) => set({ search, page: 1 }), // Reset to page 1 on new search
  setRegionId: (regionId) => set({ regionId, siteId: '', page: 1 }), // Reset site and page on region changes
  setSiteId: (siteId) => set({ siteId, page: 1 }),
  setStatus: (status) => set({ status, page: 1 }),
  setPage: (page) => set({ page }),
  setSelectedEmployeeId: (id) => set({ selectedEmployeeId: id }),
  
  setImportOpen: (open) => set({ isImportOpen: open }),
  setCreateOpen: (open) => set({ isCreateOpen: open }),
  setEditOpen: (open) => set({ isEditOpen: open }),
  setAddDependentOpen: (open) => set({ isAddDependentOpen: open }),
  
  resetFilters: () => set({ search: '', regionId: '', siteId: '', status: '', page: 1 })
}));
