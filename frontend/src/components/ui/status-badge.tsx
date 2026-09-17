'use client';

// ============================================================
// Company OS — Status Badge Component
// ============================================================

import React from 'react';
import { cn } from '@/lib/utils';

export type StatusVariant = 'success' | 'warning' | 'danger' | 'info' | 'default' | 'muted';

export interface StatusBadgeProps {
  children?: React.ReactNode;
  status?: string;
  variant?: StatusVariant;
  className?: string;
  dot?: boolean;
}

const variantStyles: Record<StatusVariant, { bg: string; text: string; dot: string }> = {
  success: {
    bg: 'color-mix(in srgb, var(--success) 15%, transparent)',
    text: 'var(--success)',
    dot: 'var(--success)',
  },
  warning: {
    bg: 'color-mix(in srgb, var(--warning) 15%, transparent)',
    text: 'var(--warning)',
    dot: 'var(--warning)',
  },
  danger: {
    bg: 'color-mix(in srgb, var(--danger) 15%, transparent)',
    text: 'var(--danger)',
    dot: 'var(--danger)',
  },
  info: {
    bg: 'color-mix(in srgb, var(--info) 15%, transparent)',
    text: 'var(--info)',
    dot: 'var(--info)',
  },
  default: {
    bg: 'color-mix(in srgb, var(--primary) 15%, transparent)',
    text: 'var(--primary)',
    dot: 'var(--primary)',
  },
  muted: {
    bg: 'var(--muted)',
    text: 'var(--muted-foreground)',
    dot: 'var(--muted-foreground)',
  },
};

/** Helper: map common status strings to badge variants */
export function getStatusVariant(status: string): StatusVariant {
  const s = status.toLowerCase();
  if (['active', 'completed', 'approved', 'resolved', 'paid', 'posted', 'won'].includes(s)) return 'success';
  if (['pending', 'in_progress', 'draft', 'pending_approval', 'negotiation'].includes(s)) return 'warning';
  if (['overdue', 'rejected', 'cancelled', 'expired', 'failed', 'lost'].includes(s)) return 'danger';
  if (['sent', 'assigned', 'selected', 'editing', 'lead', 'contacted'].includes(s)) return 'info';
  if (['inactive', 'deactivated'].includes(s)) return 'muted';
  return 'default';
}

export function StatusBadge({
  children,
  status,
  variant,
  className,
  dot = true,
}: StatusBadgeProps) {
  const content = children ?? status ?? 'Unknown';
  const finalVariant = variant ?? (status ? getStatusVariant(status) : 'default');
  const style = variantStyles[finalVariant] || variantStyles.default;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
        className
      )}
      style={{ backgroundColor: style.bg, color: style.text }}
    >
      {dot && (
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: style.dot }}
        />
      )}
      {content}
    </span>
  );
}
