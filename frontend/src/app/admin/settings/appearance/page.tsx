'use client';

// ============================================================
// Company OS — Appearance Settings Page (Theme Engine)
// ============================================================

import React, { useState, useCallback } from 'react';
import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout';
import { useTheme } from '@/providers/ThemeProvider';
import type { ThemeConfig, ThemeColors } from '@/types/theme';
import {
  Palette, Check, Download, Upload, RotateCcw, Save,
  Hexagon, LayoutDashboard, Table2, SquareCheck,
} from 'lucide-react';
import { toast } from 'sonner';

// ── Theme Card ──────────────────────────────────────────────

function ThemeCard({ theme, isActive, onSelect }: {
  theme: ThemeConfig;
  isActive: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className="relative rounded-xl border p-4 text-left transition-all w-full"
      style={{
        backgroundColor: 'var(--card)',
        borderColor: isActive ? 'var(--primary)' : 'var(--border)',
        boxShadow: isActive ? '0 0 0 1px var(--primary)' : 'none',
      }}
      onMouseEnter={(e) => {
        if (!isActive) e.currentTarget.style.borderColor = 'var(--muted-foreground)';
      }}
      onMouseLeave={(e) => {
        if (!isActive) e.currentTarget.style.borderColor = 'var(--border)';
      }}
    >
      {isActive && (
        <div
          className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'var(--primary)' }}
        >
          <Check className="w-3 h-3" style={{ color: 'var(--primary-foreground)' }} />
        </div>
      )}

      {/* Mini preview */}
      <div
        className="rounded-lg overflow-hidden mb-3 border"
        style={{ borderColor: theme.colors.border }}
      >
        <div className="flex" style={{ backgroundColor: theme.colors.background, height: 72 }}>
          {/* Mini sidebar */}
          <div
            className="w-12 flex flex-col items-center gap-1 py-2"
            style={{ backgroundColor: theme.colors.surface, borderRight: `1px solid ${theme.colors.border}` }}
          >
            <div className="w-5 h-5 rounded" style={{ backgroundColor: theme.colors.primary, opacity: 0.8 }} />
            <div className="w-5 h-1 rounded-full" style={{ backgroundColor: theme.colors.border }} />
            <div className="w-5 h-1 rounded-full" style={{ backgroundColor: theme.colors.border }} />
            <div className="w-5 h-1 rounded-full" style={{ backgroundColor: theme.colors.border }} />
          </div>
          {/* Mini content */}
          <div className="flex-1 p-2">
            <div className="h-1.5 w-12 rounded-full mb-2" style={{ backgroundColor: theme.colors.foreground, opacity: 0.3 }} />
            <div className="flex gap-1.5">
              <div className="h-6 flex-1 rounded" style={{ backgroundColor: theme.colors.surfaceElevated }} />
              <div className="h-6 flex-1 rounded" style={{ backgroundColor: theme.colors.surfaceElevated }} />
            </div>
            <div className="mt-1.5 h-4 rounded" style={{ backgroundColor: theme.colors.surface }} />
          </div>
        </div>
      </div>

      {/* Color swatches */}
      <div className="flex gap-1 mb-2">
        {[theme.colors.primary, theme.colors.secondary, theme.colors.success, theme.colors.warning, theme.colors.danger].map((c, i) => (
          <div key={i} className="w-4 h-4 rounded-full border" style={{ backgroundColor: c, borderColor: theme.colors.border }} />
        ))}
      </div>

      <div className="font-medium text-xs" style={{ color: 'var(--foreground)' }}>
        {theme.name}
      </div>
      <div className="text-[10px] mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
        {theme.description} · {theme.mode}
      </div>
    </button>
  );
}

// ── Color Field ─────────────────────────────────────────────

function ColorField({ label, value, onChange }: {
  label: string;
  value: string;
  onChange: (val: string) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-8 h-8 rounded-md border cursor-pointer"
        style={{ borderColor: 'var(--border)' }}
      />
      <div className="flex-1">
        <label className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
          {label}
        </label>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-md border px-2 py-1 text-xs font-mono mt-0.5 outline-none"
          style={{
            backgroundColor: 'var(--input)',
            borderColor: 'var(--border)',
            color: 'var(--foreground)',
          }}
        />
      </div>
    </div>
  );
}

// ── Live Preview ────────────────────────────────────────────

function LivePreview({ colors }: { colors: ThemeColors }) {
  return (
    <div
      className="rounded-xl overflow-hidden border"
      style={{ borderColor: colors.border, backgroundColor: colors.background }}
    >
      {/* Mini topbar */}
      <div
        className="flex items-center justify-between px-4 py-2 border-b"
        style={{ backgroundColor: colors.surface, borderColor: colors.border }}
      >
        <span className="text-xs font-medium" style={{ color: colors.foreground }}>Dashboard</span>
        <div className="flex gap-1.5">
          <div className="w-5 h-5 rounded-full" style={{ backgroundColor: colors.primary, opacity: 0.5 }} />
        </div>
      </div>

      <div className="flex" style={{ minHeight: 200 }}>
        {/* Mini sidebar */}
        <div
          className="w-20 py-3 px-2 border-r flex flex-col gap-1"
          style={{ backgroundColor: colors.surface, borderColor: colors.border }}
        >
          {['Dashboard', 'Clients', 'My Work', 'Reports'].map((item, i) => (
            <div
              key={item}
              className="rounded-md px-2 py-1.5 text-[9px]"
              style={{
                backgroundColor: i === 0 ? colors.accent : 'transparent',
                color: i === 0 ? colors.primary : colors.mutedForeground,
              }}
            >
              {item}
            </div>
          ))}
        </div>

        {/* Mini content */}
        <div className="flex-1 p-3 space-y-2">
          {/* Metric cards */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Active', val: '42', col: colors.primary },
              { label: 'Pending', val: '18', col: colors.warning },
            ].map((m) => (
              <div
                key={m.label}
                className="rounded-md border p-2"
                style={{ backgroundColor: colors.card, borderColor: colors.border }}
              >
                <div className="text-[8px]" style={{ color: colors.mutedForeground }}>{m.label}</div>
                <div className="text-sm font-bold" style={{ color: colors.foreground }}>{m.val}</div>
              </div>
            ))}
          </div>

          {/* Button */}
          <button
            className="rounded-md px-3 py-1.5 text-[10px] font-medium"
            style={{ backgroundColor: colors.primary, color: colors.primaryForeground }}
          >
            Create Client
          </button>

          {/* Status badges */}
          <div className="flex gap-1.5">
            {[
              { label: 'Active', bg: colors.success },
              { label: 'Pending', bg: colors.warning },
              { label: 'Overdue', bg: colors.danger },
            ].map((s) => (
              <span
                key={s.label}
                className="rounded-full px-2 py-0.5 text-[8px]"
                style={{
                  backgroundColor: `${s.bg}22`,
                  color: s.bg,
                }}
              >
                {s.label}
              </span>
            ))}
          </div>

          {/* Mini table row */}
          <div
            className="rounded-md border p-2 flex items-center justify-between"
            style={{ backgroundColor: colors.surface, borderColor: colors.border }}
          >
            <span className="text-[9px]" style={{ color: colors.foreground }}>Sample Row</span>
            <span className="text-[9px]" style={{ color: colors.mutedForeground }}>Data</span>
          </div>

          {/* Input */}
          <input
            className="w-full rounded-md border px-2 py-1 text-[9px]"
            placeholder="Search..."
            readOnly
            style={{
              backgroundColor: colors.surfaceElevated,
              borderColor: colors.border,
              color: colors.foreground,
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────

export default function AppearancePage() {
  const {
    currentTheme,
    availableThemes,
    setTheme,
    applyCustomTheme,
    previewColors,
    resetPreview,
    exportCurrentTheme,
    importThemeFromJson,
    isPreviewing,
  } = useTheme();

  const defaultCustomColors: ThemeColors = currentTheme.colors;
  const [customColors, setCustomColors] = useState<ThemeColors>(defaultCustomColors);
  const [showCustom, setShowCustom] = useState(false);

  const updateColor = useCallback((key: keyof ThemeColors, value: string) => {
    const updated = { ...customColors, [key]: value };
    setCustomColors(updated);
    previewColors(updated);
  }, [customColors, previewColors]);

  const handleSaveCustom = () => {
    applyCustomTheme(customColors, 'Custom Theme');
    toast.success('Custom theme saved');
  };

  const handleReset = () => {
    setCustomColors(currentTheme.colors);
    resetPreview();
    toast.info('Theme reset');
  };

  const handleExport = () => {
    const data = exportCurrentTheme();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentTheme.name.toLowerCase().replace(/\s+/g, '-')}-theme.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Theme exported');
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const json = JSON.parse(text);
        const result = importThemeFromJson(json);
        if (result.success) {
          toast.success('Theme imported successfully');
        } else {
          toast.error(`Import failed: ${result.errors.join(', ')}`);
        }
      } catch {
        toast.error('Invalid JSON file');
      }
    };
    input.click();
  };

  const colorFields: Array<{ key: keyof ThemeColors; label: string }> = [
    { key: 'primary', label: 'Primary' },
    { key: 'primaryForeground', label: 'Primary Foreground' },
    { key: 'secondary', label: 'Secondary' },
    { key: 'background', label: 'Background' },
    { key: 'surface', label: 'Surface' },
    { key: 'surfaceElevated', label: 'Elevated Surface' },
    { key: 'foreground', label: 'Text' },
    { key: 'mutedForeground', label: 'Muted Text' },
    { key: 'border', label: 'Border' },
    { key: 'success', label: 'Success' },
    { key: 'warning', label: 'Warning' },
    { key: 'danger', label: 'Danger' },
    { key: 'info', label: 'Info' },
  ];

  return (
    <AuthenticatedLayout
      breadcrumbs={[
        { label: 'Settings', href: '/admin/settings' },
        { label: 'Appearance' },
      ]}
    >
      <div className="page-container space-y-8">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-semibold" style={{ color: 'var(--foreground)' }}>
              Appearance
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
              Customize the look and feel of Company OS
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors"
              style={{ borderColor: 'var(--border)', color: 'var(--foreground)', backgroundColor: 'var(--surface)' }}
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
            <button
              onClick={handleImport}
              className="flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors"
              style={{ borderColor: 'var(--border)', color: 'var(--foreground)', backgroundColor: 'var(--surface)' }}
            >
              <Upload className="w-3.5 h-3.5" />
              Import
            </button>
          </div>
        </div>

        {/* Theme Templates */}
        <div>
          <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
            Theme Templates
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {availableThemes.map((theme) => (
              <ThemeCard
                key={theme.id}
                theme={theme}
                isActive={currentTheme.id === theme.id && !isPreviewing}
                onSelect={() => {
                  setTheme(theme.id);
                  setCustomColors(theme.colors);
                  toast.success(`Theme: ${theme.name}`);
                }}
              />
            ))}
          </div>
        </div>

        {/* Custom Theme */}
        <div
          className="rounded-xl border p-6"
          style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4" style={{ color: 'var(--primary)' }} />
              <h2 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                Custom Theme
              </h2>
            </div>
            <button
              onClick={() => setShowCustom(!showCustom)}
              className="text-xs px-3 py-1.5 rounded-md border transition-colors"
              style={{
                borderColor: 'var(--border)',
                color: 'var(--foreground)',
                backgroundColor: showCustom ? 'var(--accent)' : 'var(--surface)',
              }}
            >
              {showCustom ? 'Hide Editor' : 'Open Editor'}
            </button>
          </div>

          {showCustom && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Color pickers */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold mb-3" style={{ color: 'var(--muted-foreground)' }}>
                  COLORS
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {colorFields.map((f) => (
                    <ColorField
                      key={f.key}
                      label={f.label}
                      value={customColors[f.key]}
                      onChange={(v) => updateColor(f.key, v)}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-4">
                  <button
                    onClick={handleSaveCustom}
                    className="btn-metallic flex items-center gap-2 rounded-lg px-4 py-2 text-sm"
                  >
                    <Save className="w-4 h-4" />
                    Save Theme
                  </button>
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors"
                    style={{
                      borderColor: 'var(--border)',
                      color: 'var(--foreground)',
                      backgroundColor: 'var(--surface)',
                    }}
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset
                  </button>
                </div>
              </div>

              {/* Live preview */}
              <div>
                <h3 className="text-xs font-semibold mb-3" style={{ color: 'var(--muted-foreground)' }}>
                  LIVE PREVIEW
                </h3>
                <LivePreview colors={customColors} />
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
