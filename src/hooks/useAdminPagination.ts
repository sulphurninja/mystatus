'use client';

import { useCallback, useMemo, useState } from 'react';

export type AdminPaginationState = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setTotal: (total: number) => void;
  setFromResponse: (input: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    pages?: number;
  }) => void;
  reset: () => void;
  offset: number;
};

export function useAdminPagination(initialLimit = 20): AdminPaginationState {
  const [page, setPage] = useState(1);
  const [limit, setLimitState] = useState(initialLimit);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const setLimit = useCallback((next: number) => {
    setLimitState(next);
    setPage(1);
  }, []);

  const setFromResponse = useCallback((input: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    pages?: number;
  }) => {
    if (typeof input.page === 'number') setPage(input.page);
    if (typeof input.limit === 'number') setLimitState(input.limit);
    if (typeof input.total === 'number') setTotal(input.total);
    const pages = input.totalPages ?? input.pages;
    if (typeof pages === 'number') setTotalPages(Math.max(1, pages));
    else if (typeof input.total === 'number' && typeof input.limit === 'number') {
      setTotalPages(Math.max(1, Math.ceil(input.total / input.limit)));
    }
  }, []);

  const reset = useCallback(() => {
    setPage(1);
    setTotal(0);
    setTotalPages(1);
  }, []);

  return useMemo(
    () => ({
      page,
      limit,
      total,
      totalPages,
      setPage,
      setLimit,
      setTotal,
      setFromResponse,
      reset,
      offset: (page - 1) * limit,
    }),
    [page, limit, total, totalPages, setLimit, setFromResponse, reset]
  );
}

/** Client-side slice helper when API has no pagination yet */
export function paginateArray<T>(items: T[], page: number, limit: number) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / limit) || 1);
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * limit;
  return {
    items: items.slice(start, start + limit),
    page: safePage,
    limit,
    total,
    totalPages,
  };
}
