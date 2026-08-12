'use client';

import { ReactNode } from 'react';

export default function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="admin-panel px-6 py-14 text-center">
      <p className="admin-display text-lg font-semibold text-[var(--admin-text)]">{title}</p>
      {description ? (
        <p className="mt-2 text-sm text-[var(--admin-muted)] max-w-md mx-auto">{description}</p>
      ) : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}
