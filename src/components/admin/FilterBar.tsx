'use client';

import { ReactNode } from 'react';

export default function FilterBar({
  children,
  search,
  onSearchChange,
  searchPlaceholder = 'Search…',
}: {
  children?: ReactNode;
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
}) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between mb-4">
      {onSearchChange ? (
        <div className="w-full lg:max-w-sm">
          <input
            type="search"
            value={search ?? ''}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="admin-input"
          />
        </div>
      ) : (
        <div />
      )}
      {children ? (
        <div className="flex flex-wrap items-center gap-2">{children}</div>
      ) : null}
    </div>
  );
}
