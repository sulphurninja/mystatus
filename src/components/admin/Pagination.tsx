'use client';

export default function Pagination({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  onLimitChange,
  limitOptions = [10, 20, 25, 50],
}: {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  limitOptions?: number[];
}) {
  const safeTotalPages = Math.max(1, totalPages || 1);
  const canPrev = page > 1;
  const canNext = page < safeTotalPages;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-4 mt-4 border-t border-[var(--admin-border)]">
      <p className="text-xs text-[var(--admin-muted)] tabular-nums">
        {total === 0 ? 'No results' : `Showing ${from}–${to} of ${total}`}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {onLimitChange ? (
          <label className="flex items-center gap-2 text-xs text-[var(--admin-muted)]">
            Rows
            <select
              className="admin-input !w-auto !py-1.5 !px-2"
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
            >
              {limitOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <button
          type="button"
          className="admin-btn admin-btn-secondary !py-1.5 !px-3"
          disabled={!canPrev}
          onClick={() => onPageChange(page - 1)}
        >
          Prev
        </button>
        <span className="text-xs tabular-nums text-[var(--admin-muted)] min-w-[4.5rem] text-center">
          {page} / {safeTotalPages}
        </span>
        <button
          type="button"
          className="admin-btn admin-btn-secondary !py-1.5 !px-3"
          disabled={!canNext}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
