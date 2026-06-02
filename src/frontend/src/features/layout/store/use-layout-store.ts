// use-layout-store.ts
// Zustand store for managing dynamic layout panels and active view tabs in UMIS

import { create } from 'zustand';

export type TabId = 'beneficiaries' | 'settings' | 'dependents' | 'regions';

interface LayoutState {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

export const useLayoutStore = create<LayoutState>((set) => ({
  activeTab: 'beneficiaries',
  setActiveTab: (tab) => set({ activeTab: tab }),
  isSidebarOpen: true,
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen }))
}));
