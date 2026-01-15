/**
 * Theme store
 * Manages UI theme state: light/dark mode and investor/classic tone
 * DEV-only: used by DesignLab for live theming
 */

import { create } from 'zustand';
import type { ColorMode, ToneMode } from '@theme/tokens';

interface ThemeStore {
  mode: ColorMode;
  tone: ToneMode;
  setMode: (mode: ColorMode) => void;
  setTone: (tone: ToneMode) => void;
  toggleMode: () => void;
  toggleTone: () => void;
}

export const useThemeStore = create<ThemeStore>((set) => ({
  mode: 'light',
  tone: 'classic',

  setMode: (mode) => set({ mode }),
  setTone: (tone) => set({ tone }),

  toggleMode: () => set((state) => ({ mode: state.mode === 'light' ? 'dark' : 'light' })),
  toggleTone: () => set((state) => ({ tone: state.tone === 'classic' ? 'investor' : 'classic' })),
}));
