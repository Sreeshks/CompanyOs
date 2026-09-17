'use client';

// ============================================================
// Company OS — Authenticated Layout Wrapper
// ============================================================

import React from 'react';

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
  title?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  return <>{children}</>;
}
