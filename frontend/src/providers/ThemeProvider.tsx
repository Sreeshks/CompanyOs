'use client';

// ============================================================
// Company OS — Theme Provider
// ============================================================

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ThemeConfig, ThemeColors } from '@/types/theme';
import { themes, DEFAULT_THEME_ID, getThemeById, getDefaultTheme } from '@/theme/themes';
import {
  applyTheme,
  applyThemeColors,
  getSavedThemeId,
  saveThemeId,
  getSavedCustomTheme,
  saveCustomTheme,
  clearCustomTheme,
  exportTheme,
  importTheme,
} from '@/theme/theme-utils';
import type { ThemeExport } from '@/types/theme';

interface ThemeContextValue {
  /** Current active theme config */
  currentTheme: ThemeConfig;
  /** All available predefined themes */
  availableThemes: ThemeConfig[];
  /** The custom theme (if any) */
  customTheme: ThemeConfig | null;
  /** Switch to a predefined theme by ID */
  setTheme: (themeId: string) => void;
  /** Apply and save a custom theme */
  applyCustomTheme: (colors: ThemeColors, name?: string) => void;
  /** Preview colors without saving */
  previewColors: (colors: ThemeColors) => void;
  /** Reset to the current saved theme (cancel preview) */
  resetPreview: () => void;
  /** Clear custom theme and revert to default */
  clearCustom: () => void;
  /** Export current theme as JSON */
  exportCurrentTheme: () => ThemeExport;
  /** Import a theme from JSON */
  importThemeFromJson: (data: unknown) => { success: boolean; errors: string[] };
  /** Whether currently previewing unsaved changes */
  isPreviewing: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<ThemeConfig>(getDefaultTheme());
  const [customTheme, setCustomThemeState] = useState<ThemeConfig | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);

  // Load saved theme on mount
  useEffect(() => {
    const savedId = getSavedThemeId();
    const savedCustom = getSavedCustomTheme();

    if (savedCustom) {
      setCustomThemeState(savedCustom);
    }

    if (savedId === 'custom' && savedCustom) {
      setCurrentTheme(savedCustom);
      applyTheme(savedCustom);
    } else if (savedId) {
      const found = getThemeById(savedId);
      if (found) {
        setCurrentTheme(found);
        applyTheme(found);
      } else {
        applyTheme(getDefaultTheme());
      }
    } else {
      applyTheme(getDefaultTheme());
    }
  }, []);

  const setTheme = useCallback((themeId: string) => {
    const found = getThemeById(themeId);
    if (found) {
      setCurrentTheme(found);
      applyTheme(found);
      saveThemeId(themeId);
      setIsPreviewing(false);
    }
  }, []);

  const applyCustomThemeHandler = useCallback((colors: ThemeColors, name?: string) => {
    const custom: ThemeConfig = {
      id: 'custom',
      name: name || 'Custom Theme',
      description: 'User-defined custom theme',
      mode: isColorDark(colors.background) ? 'dark' : 'light',
      colors,
    };
    setCustomThemeState(custom);
    setCurrentTheme(custom);
    applyTheme(custom);
    saveCustomTheme(custom);
    saveThemeId('custom');
    setIsPreviewing(false);
  }, []);

  const previewColors = useCallback((colors: ThemeColors) => {
    applyThemeColors(colors);
    setIsPreviewing(true);
  }, []);

  const resetPreview = useCallback(() => {
    applyTheme(currentTheme);
    setIsPreviewing(false);
  }, [currentTheme]);

  const clearCustom = useCallback(() => {
    clearCustomTheme();
    setCustomThemeState(null);
    const defaultTheme = getDefaultTheme();
    setCurrentTheme(defaultTheme);
    applyTheme(defaultTheme);
    saveThemeId(DEFAULT_THEME_ID);
    setIsPreviewing(false);
  }, []);

  const exportCurrentTheme = useCallback(() => {
    return exportTheme(currentTheme);
  }, [currentTheme]);

  const importThemeFromJson = useCallback((data: unknown) => {
    const result = importTheme(data);
    if (result.theme) {
      const imported = result.theme;
      setCustomThemeState(imported);
      setCurrentTheme(imported);
      applyTheme(imported);
      saveCustomTheme(imported);
      saveThemeId('custom');
      return { success: true, errors: [] };
    }
    return { success: false, errors: result.errors };
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        currentTheme,
        availableThemes: themes,
        customTheme,
        setTheme,
        applyCustomTheme: applyCustomThemeHandler,
        previewColors,
        resetPreview,
        clearCustom,
        exportCurrentTheme,
        importThemeFromJson,
        isPreviewing,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

/**
 * Heuristic: determines if a hex color is "dark" based on luminance.
 */
function isColorDark(hex: string): boolean {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.5;
}
