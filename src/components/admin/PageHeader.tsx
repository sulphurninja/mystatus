'use client';

import type { ComponentType, ReactNode } from 'react';
import type { LucideProps } from 'lucide-react';

export default function PageHeader({
  title,
  description,
  actions,
  icon: Icon,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  icon?: ComponentType<LucideProps>;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        {Icon ? (
          <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/20">
            <Icon className="h-5 w-5" strokeWidth={2} />
          </span>
        ) : null}
        <div className="min-w-0">
          <h1 className="admin-display text-2xl font-semibold tracking-tight text-[var(--admin-text)] sm:text-3xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-1 max-w-2xl text-sm text-[var(--admin-muted)]">{description}</p>
          ) : null}
        </div>
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
