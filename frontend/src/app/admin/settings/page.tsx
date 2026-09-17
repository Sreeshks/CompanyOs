'use client';

// ============================================================
// Company OS — System Settings Hub
// ============================================================

import React from 'react';
import Link from 'next/link';
import {
  Palette, Shield, Users, Building2, Award,
  Layers, Package, Workflow, Tag, Receipt,
  ScrollText, ChevronRight, Sliders, Database
} from 'lucide-react';

interface SettingsCard {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

const settingsSections: { category: string; items: SettingsCard[] }[] = [
  {
    category: 'BRANDING & INTERFACE',
    items: [
      {
        title: 'Appearance & Theme Engine',
        description: 'Configure corporate themes, accent colors, contrast modes, and import/export CSS presets.',
        href: '/admin/settings/appearance',
        icon: Palette,
        badge: '12 Themes',
      },
    ],
  },
  {
    category: 'ACCESS & SECURITY',
    items: [
      {
        title: 'User Accounts',
        description: 'Manage staff credentials, department allocations, designations, and account status.',
        href: '/admin/users',
        icon: Users,
      },
      {
        title: 'Roles & Permissions Matrix',
        description: 'Configure RBAC security policies, module permissions, and staff authorization boundaries.',
        href: '/admin/roles',
        icon: Shield,
      },
      {
        title: 'Audit Logs',
        description: 'Immutable operational history tracking entity creation, modifications, and signoffs.',
        href: '/admin/audit-logs',
        icon: ScrollText,
      },
    ],
  },
  {
    category: 'ORGANIZATION & MASTER DATA',
    items: [
      {
        title: 'Departments',
        description: 'Define organizational divisions (Creative, Copy, Tech, Management).',
        href: '/admin/departments',
        icon: Building2,
      },
      {
        title: 'Job Designations',
        description: 'Define professional hierarchy levels and staff titles.',
        href: '/admin/designations',
        icon: Award,
      },
      {
        title: 'Billing Companies & Legal Entities',
        description: 'Setup registered companies, VAT numbers, and corporate invoicing details.',
        href: '/admin/billing-companies',
        icon: Receipt,
      },
      {
        title: 'Services Catalog',
        description: 'Manage core service lines (Retainers, SEO, Content Marketing).',
        href: '/admin/services',
        icon: Layers,
      },
      {
        title: 'Package Tiers',
        description: 'Setup pricing tiers, task deliverables, and monthly quotas.',
        href: '/admin/packages',
        icon: Package,
      },
      {
        title: 'Workflow Pipelines',
        description: 'Configure multi-stage state machines and automated task handoffs.',
        href: '/admin/workflows',
        icon: Workflow,
      },
      {
        title: 'Task Classifications',
        description: 'Define task types for specialist assignment rules.',
        href: '/admin/task-types',
        icon: Tag,
      },
    ],
  },
];

export default function SettingsHubPage() {
  return (
    <div className="p-6 space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
          System Administration & Settings
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
          Manage global system configurations, master data registries, security policies, and themes
        </p>
      </div>

      <div className="space-y-8">
        {settingsSections.map((section, idx) => (
          <div key={idx} className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>
              {section.category}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-xl border p-5 flex flex-col justify-between space-y-4 hover:shadow-md transition-all duration-150 group"
                    style={{
                      backgroundColor: 'var(--surface)',
                      borderColor: 'var(--border)',
                    }}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors group-hover:scale-105"
                          style={{
                            backgroundColor: 'var(--accent)',
                            color: 'var(--primary)',
                          }}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        {item.badge && (
                          <span
                            className="text-[10px] font-mono px-2 py-0.5 rounded border"
                            style={{ borderColor: 'var(--border)', color: 'var(--primary)' }}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>

                      <div>
                        <h3 className="font-semibold text-sm group-hover:text-[var(--primary)] transition-colors" style={{ color: 'var(--foreground)' }}>
                          {item.title}
                        </h3>
                        <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-xs font-medium pt-2 border-t" style={{ borderColor: 'var(--border)', color: 'var(--primary)' }}>
                      <span>Configure</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
