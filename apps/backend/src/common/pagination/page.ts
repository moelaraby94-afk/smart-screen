/**
 * The envelope every list endpoint returns.
 *
 * `limit` is echoed back because the request's value is clamped to
 * MAX_PAGE_SIZE — a client that asked for more needs to see what it actually
 * got, or it will believe it has the whole collection.
 */
export type Page<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export function buildPage<T>(
  items: T[],
  total: number,
  query: { page: number; limit: number },
): Page<T> {
  return {
    items,
    page: query.page,
    limit: query.limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / query.limit)),
  };
}
