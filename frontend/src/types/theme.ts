// ============================================================
// Company OS — Theme Type Definitions
// ============================================================

export type ThemeMode = 'dark' | 'light' | 'system';

export interface ThemeColors {
  background: string;
  foreground: string;
  surface: string;
  surfaceElevated: string;
  border: string;
  input: string;
  ring: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  success: string;
  successForeground: string;
  warning: string;
  warningForeground: string;
  danger: string;
  dangerForeground: string;
  info: string;
  infoForeground: string;
}

export interface ThemeConfig {
  id: string;
  name: string;
  description: string;
  mode: ThemeMode;
  colors: ThemeColors;
}

export interface CustomThemeConfig extends ThemeConfig {
  id: 'custom';
  created_at?: string;
  updated_at?: string;
}

export interface UserThemePreference {
  user_id?: string;
  theme_id: string;
  custom_theme_config?: ThemeColors;
  mode_override?: ThemeMode;
  updated_at?: string;
}

export interface ThemeExport {
  name: string;
  mode: ThemeMode;
  colors: ThemeColors;
  version: string;
  exported_at: string;
}
