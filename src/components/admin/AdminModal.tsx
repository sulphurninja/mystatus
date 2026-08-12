'use client';

import { ReactNode, useEffect } from 'react';

export default function AdminModal({
  open,
  title,
  onClose,
  children,
  footer,
  wide = false,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
      />
      <div
        className={`relative w-full ${wide ? 'max-w-3xl' : 'max-w-xl'} max-h-[92vh] flex flex-col bg-[var(--admin-panel)] border border-[var(--admin-border)] rounded-t-[var(--admin-radius)] sm:rounded-[var(--admin-radius)] shadow-2xl`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-[var(--admin-border)] shrink-0">
          <h2 className="admin-display text-lg font-semibold text-[var(--admin-text)] truncate">
            {title}
          </h2>
          <button type="button" className="admin-btn admin-btn-ghost !px-2" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="px-5 py-4 overflow-y-auto min-h-0 flex-1">{children}</div>
        {footer ? (
          <div className="px-5 py-4 border-t border-[var(--admin-border)] flex flex-wrap justify-end gap-2 shrink-0 bg-[var(--admin-panel)]">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
