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
