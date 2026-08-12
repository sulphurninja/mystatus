'use client';

import { ReactNode } from 'react';
import EmptyState from './EmptyState';

export type DataTableColumn<T> = {
  key: string;
  header: string;
  className?: string;
  render: (row: T) => ReactNode;
};

export default function DataTable<T>({
  columns,
  rows,
  rowKey,
  emptyTitle = 'Nothing here yet',
  emptyDescription,
  emptyAction,
  loading = false,
  footer,
}: {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  loading?: boolean;
  footer?: ReactNode;
}) {
  if (loading) {
    return (
      <div className="admin-panel p-8 text-sm text-[var(--admin-muted)]">Loading…</div>
    );
  }

  if (!rows.length) {
    return (
      <div className="space-y-3">
        <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />
        {footer ? <div className="admin-panel px-4 pb-4">{footer}</div> : null}
      </div>
    );
  }

  return (
    <div className="admin-panel overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="sticky top-0 bg-[var(--admin-panel-elevated)] border-b border-[var(--admin-border)]">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--admin-faint)] whitespace-nowrap ${col.className || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={rowKey(row)}
                className="border-b border-[var(--admin-border)] last:border-b-0 hover:bg-white/[0.02]"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-4 py-3 align-middle text-[var(--admin-text)] ${col.className || ''}`}
                  >
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {footer ? <div className="px-4 pb-4">{footer}</div> : null}
    </div>
  );
}
