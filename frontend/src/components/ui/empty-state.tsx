'use client';

// ============================================================
// Company OS — Empty State Component
// ============================================================

import React from 'react';
import { Inbox, Plus } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ElementType;
  title: string;
  description?: string;
  action?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
        style={{ backgroundColor: 'var(--muted)' }}
      >
        <Icon className="w-6 h-6" style={{ color: 'var(--muted-foreground)' }} />
      </div>
      <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--foreground)' }}>
        {title}
      </h3>
      {description && (
        <p className="text-sm max-w-sm mb-4" style={{ color: 'var(--muted-foreground)' }}>
          {description}
        </p>
      )}
      {action ? (
        action
      ) : actionLabel && onAction ? (
        <button
          onClick={onAction}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium metallic-btn"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{actionLabel}</span>
        </button>
      ) : null}
    </div>
  );
}
