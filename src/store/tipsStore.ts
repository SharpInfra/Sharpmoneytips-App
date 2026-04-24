import { create } from 'zustand';

interface Tip {
  id: string;
  matchId: string;
  targetTeam: string;
  betType: string;
  betOption: string | null;
  odds: number;
  probability: number;
  ev: number;
  roi: number;
  strategyTag: string;
  riskLevel: string | null;
  packageName: string | null;
  showToUser: boolean;
  status: string;
  result: string;
  brandId: string;
  marketRegion: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

interface TipsStore {
  tips: Tip[];
  isLoading: boolean;
  error: string | null;
  setTips: (tips: Tip[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useTipsStore = create<TipsStore>((set) => ({
  tips: [],
  isLoading: false,
  error: null,
  setTips: (tips) => set({ tips }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));
