/**
 * Semantic design tokens (Fortune-50).
 * No brand-lock yet; supports light/dark + investor/classic tone later.
 */
export type ColorMode = 'light' | 'dark';
export type ToneMode = 'investor' | 'classic';

export type ThemeTokens = {
  color: {
    bg: string;
    surface: string;
    surface2: string;
    text: string;
    textMuted: string;
    border: string;
    primary: string;
    success: string;
    warning: string;
    danger: string;
  };
  spacing: { xs: number; sm: number; md: number; lg: number; xl: number };
  radius: { sm: number; md: number; lg: number; xl: number };
  typography: {
    fontSize: { sm: number; base: number; lg: number; xl: number };
    lineHeight: { sm: number; base: number; lg: number };
    fontWeight: { regular: '400'; medium: '500'; semibold: '600'; bold: '700' };
  };
};

/**
 * Color definitions for light/dark mode + investor/classic tone
 * Returns semantic tokens based on mode and tone
 */
export function getTheme(mode: ColorMode, tone: ToneMode): ThemeTokens {
  // Light mode palette
  const lightColors = {
    bg: '#FFFFFF',
    surface: '#F8F9FA',
    surface2: '#F0F2F5',
    text: '#1A1A1A',
    textMuted: '#666666',
    border: '#E0E0E0',
    primary: '#0066CC',
    success: '#22C55E',
    warning: '#F59E0B',
    danger: '#EF4444',
  };

  // Dark mode palette
  const darkColors = {
    bg: '#0F0F0F',
    surface: '#1A1A1A',
    surface2: '#2A2A2A',
    text: '#FFFFFF',
    textMuted: '#AAAAAA',
    border: '#333333',
    primary: '#3B82F6',
    success: '#4ADE80',
    warning: '#FBBF24',
    danger: '#F87171',
  };

  // Investor tone: more professional, financial blues
  const investorAdjust = (colors: typeof lightColors): typeof lightColors => ({
    ...colors,
    primary: mode === 'light' ? '#0052A3' : '#60A5FA',
  });

  const colors = mode === 'light' ? lightColors : darkColors;
  const adjustedColors = tone === 'investor' ? investorAdjust(colors) : colors;

  return {
    color: adjustedColors,
    spacing: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
    },
    radius: {
      sm: 4,
      md: 8,
      lg: 12,
      xl: 16,
    },
    typography: {
      fontSize: {
        sm: 14,
        base: 16,
        lg: 20,
        xl: 24,
      },
      lineHeight: {
        sm: 1.2,
        base: 1.5,
        lg: 1.75,
      },
      fontWeight: {
        regular: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },
    },
  };
}
