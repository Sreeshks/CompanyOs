'use client';

// ============================================================
// Company OS — System Permissions Registry
// ============================================================

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { UserCog, Search, Shield, Key } from 'lucide-react';
import { permissionsApi } from '@/lib/api/roles';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import type { Permission } from '@/types/role';

export default function PermissionsAdminPage() {
  const [search, setSearch] = useState('');

  const { data: permsRes, isLoading } = useQuery({
    queryKey: ['admin-permissions-list'],
    queryFn: () => permissionsApi.list(),
  });

  const permissions = permsRes?.data || [];
  const filtered = permissions.filter((p) =>
    p.code.toLowerCase().includes(search.toLowerCase()) ||
    p.module?.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase())
  );

  // Group by module
  const grouped: Record<string, Permission[]> = {};
  filtered.forEach((p) => {
    const mod = p.module || 'System';
    if (!grouped[mod]) grouped[mod] = [];
    grouped[mod].push(p);
  });

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
          Security Permissions Registry
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
          System-level authorization tokens and endpoint access capabilities
        </p>
      </div>

      <div
        className="rounded-xl border p-3"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
          <input
            type="text"
            placeholder="Search permissions by code or module..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 rounded-md border text-sm bg-transparent outline-none focus:ring-1 focus:ring-[var(--primary)]"
            style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
          />
        </div>
      </div>

      {isLoading ? (
        <LoadingSkeleton variant="table" count={6} />
      ) : filtered.length === 0 ? (
        <EmptyState title="No Permissions Found" description="No system permissions match your query." />
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([modName, perms]) => (
            <div
              key={modName}
              className="rounded-xl border overflow-hidden"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                  <h2 className="font-semibold text-sm uppercase tracking-wide" style={{ color: 'var(--foreground)' }}>
                    {modName} Module
                  </h2>
                </div>
                <span className="text-xs font-mono" style={{ color: 'var(--muted-foreground)' }}>
                  {perms.length} permissions
                </span>
              </div>

              <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {perms.map((p) => (
                  <div key={p.id} className="p-4 flex items-center justify-between hover:bg-[var(--accent)]/30 transition-colors">
                    <div>
                      <div className="font-mono text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                        {p.code}
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                        {p.description || 'Access authorization policy'}
                      </div>
                    </div>
                    <span className="text-xs font-mono px-2 py-0.5 rounded border" style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>
                      {p.module}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
