// ============================================================
// Company OS — Theme Utilities
// ============================================================

import { ThemeColors, ThemeConfig, ThemeExport } from '@/types/theme';

const THEME_STORAGE_KEY = 'company-os-theme-id';
const CUSTOM_THEME_STORAGE_KEY = 'company-os-custom-theme';

/**
 * Maps ThemeColors keys to CSS variable names.
 */
const CSS_VAR_MAP: Record<keyof ThemeColors, string> = {
  background: '--background',
  foreground: '--foreground',
  surface: '--surface',
  surfaceElevated: '--surface-elevated',
  border: '--border',
  input: '--input',
  ring: '--ring',
  primary: '--primary',
  primaryForeground: '--primary-foreground',
  secondary: '--secondary',
  secondaryForeground: '--secondary-foreground',
  muted: '--muted',
  mutedForeground: '--muted-foreground',
  accent: '--accent',
  accentForeground: '--accent-foreground',
  card: '--card',
  cardForeground: '--card-foreground',
  popover: '--popover',
  popoverForeground: '--popover-foreground',
  success: '--success',
  successForeground: '--success-foreground',
  warning: '--warning',
  warningForeground: '--warning-foreground',
  danger: '--danger',
  dangerForeground: '--danger-foreground',
  info: '--info',
  infoForeground: '--info-foreground',
};

/**
 * Applies a ThemeColors object to the document root as CSS variables.
 */
export function applyThemeColors(colors: ThemeColors): void {
  const root = document.documentElement;
  for (const [key, cssVar] of Object.entries(CSS_VAR_MAP)) {
    const value = colors[key as keyof ThemeColors];
    if (value) {
      root.style.setProperty(cssVar, value);
    }
  }
}

/**
 * Applies a complete ThemeConfig (colors + mode class).
 */
export function applyTheme(theme: ThemeConfig): void {
  const root = document.documentElement;
  // Set mode class for Tailwind dark mode
  root.classList.remove('dark', 'light');
  root.classList.add(theme.mode === 'dark' ? 'dark' : 'light');
  root.setAttribute('data-theme', theme.id);
  applyThemeColors(theme.colors);
}

/**
 * Gets the saved theme ID from localStorage.
 */
export function getSavedThemeId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(THEME_STORAGE_KEY);
}

/**
 * Saves the theme ID to localStorage.
 */
export function saveThemeId(themeId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(THEME_STORAGE_KEY, themeId);
}

/**
 * Gets the saved custom theme from localStorage.
 */
export function getSavedCustomTheme(): ThemeConfig | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(CUSTOM_THEME_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Saves a custom theme to localStorage.
 */
export function saveCustomTheme(theme: ThemeConfig): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CUSTOM_THEME_STORAGE_KEY, JSON.stringify(theme));
}

/**
 * Removes custom theme from localStorage.
 */
export function clearCustomTheme(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CUSTOM_THEME_STORAGE_KEY);
}

/**
 * Validates a hex color string.
 */
export function isValidHexColor(color: string): boolean {
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(color);
}

/**
 * Validates all colors in a ThemeColors object.
 */
export function validateThemeColors(colors: Partial<ThemeColors>): string[] {
  const errors: string[] = [];
  for (const [key, value] of Object.entries(colors)) {
    if (value && !isValidHexColor(value)) {
      errors.push(`Invalid color for ${key}: ${value}`);
    }
  }
  return errors;
}

/**
 * Exports a theme as a JSON object.
 */
export function exportTheme(theme: ThemeConfig): ThemeExport {
  return {
    name: theme.name,
    mode: theme.mode,
    colors: { ...theme.colors },
    version: '1.0.0',
    exported_at: new Date().toISOString(),
  };
}

/**
 * Imports and validates a theme from a JSON object.
 */
export function importTheme(data: unknown): { theme: ThemeConfig | null; errors: string[] } {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return { theme: null, errors: ['Invalid theme data: expected an object'] };
  }

  const obj = data as Record<string, unknown>;

  if (!obj.name || typeof obj.name !== 'string') {
    errors.push('Missing or invalid "name" field');
  }

  if (!obj.mode || (obj.mode !== 'dark' && obj.mode !== 'light')) {
    errors.push('Missing or invalid "mode" field (must be "dark" or "light")');
  }

  if (!obj.colors || typeof obj.colors !== 'object') {
    errors.push('Missing or invalid "colors" field');
    return { theme: null, errors };
  }

  const colorErrors = validateThemeColors(obj.colors as Partial<ThemeColors>);
  errors.push(...colorErrors);

  if (errors.length > 0) {
    return { theme: null, errors };
  }

  const theme: ThemeConfig = {
    id: `imported-${Date.now()}`,
    name: obj.name as string,
    description: (obj.description as string) || 'Imported theme',
    mode: obj.mode as 'dark' | 'light',
    colors: obj.colors as ThemeColors,
  };

  return { theme, errors: [] };
}

/**
 * Returns all CSS variable names used by the theme engine.
 */
export function getThemeCssVariables(): string[] {
  return Object.values(CSS_VAR_MAP);
}
