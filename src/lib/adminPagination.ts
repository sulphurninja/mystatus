export function parseAdminPagination(
  searchParams: URLSearchParams,
  defaults: { page?: number; limit?: number; maxLimit?: number } = {}
) {
  const defaultPage = defaults.page ?? 1;
  const defaultLimit = defaults.limit ?? 20;
  const maxLimit = defaults.maxLimit ?? 100;

  const page = Math.max(1, parseInt(searchParams.get('page') || String(defaultPage), 10) || defaultPage);
  const rawLimit = parseInt(searchParams.get('limit') || String(defaultLimit), 10) || defaultLimit;
  const limit = Math.min(Math.max(1, rawLimit), maxLimit);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

export function paginationMeta(page: number, limit: number, total: number) {
  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit) || 1),
    pages: Math.max(1, Math.ceil(total / limit) || 1),
  };
}
