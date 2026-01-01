import { create } from 'zustand';

interface AppState {
  csvData: any[];
  setCsvData: (data: any[]) => void;
  templateJson: any; // Fabric.js JSON
  setTemplateJson: (json: any) => void;
  authStatus: 'unauthenticated' | 'authenticated';
  setAuthStatus: (status: 'unauthenticated' | 'authenticated') => void;
  provider: 'google' | 'outlook' | null;
  setProvider: (provider: 'google' | 'outlook' | null) => void;
  jobId: string | null;
  setJobId: (id: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  csvData: [],
  setCsvData: (data) => set({ csvData: data }),
  templateJson: null,
  setTemplateJson: (json) => set({ templateJson: json }),
  authStatus: 'unauthenticated',
  setAuthStatus: (status) => set({ authStatus: status }),
  provider: null,
  setProvider: (provider) => set({ provider }),
  jobId: null,
  setJobId: (id) => set({ jobId: id }),
}));
