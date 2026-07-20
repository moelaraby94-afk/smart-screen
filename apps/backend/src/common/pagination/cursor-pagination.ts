export type CursorPayload = {
  id: string;
  createdAt: string;
};

export type PaginatedResult<T> = {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
};

export type PaginationOptions = {
  cursor?: string;
  limit?: number;
  sort?: string;
};

export const MAX_LIMIT = 100;
export const DEFAULT_LIMIT = 20;

export function encodeCursor(lastItem: {
  id: string;
  createdAt: Date;
}): string {
  return Buffer.from(
    JSON.stringify({
      id: lastItem.id,
      createdAt: lastItem.createdAt.toISOString(),
    }),
  ).toString('base64');
}

export function decodeCursor(cursor: string): CursorPayload {
  const decoded = JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8'));
  if (!decoded.id || !decoded.createdAt) {
    throw new Error('Invalid cursor format');
  }
  return decoded as CursorPayload;
}

export function resolveLimit(limit?: number): number {
  if (!limit || limit < 1) return DEFAULT_LIMIT;
  return Math.min(limit, MAX_LIMIT);
}

export function buildPaginatedResult<T extends { id: string; createdAt: Date }>(
  items: T[],
  limit: number,
): PaginatedResult<T> {
  const hasMore = items.length > limit;
  const sliced = hasMore ? items.slice(0, limit) : items;
  const nextCursor =
    hasMore && sliced.length > 0
      ? encodeCursor(sliced[sliced.length - 1])
      : null;
  return { items: sliced, nextCursor, hasMore };
}

export function buildCursorWhere(cursor?: string): Record<string, unknown> {
  if (!cursor) return {};
  const { id, createdAt } = decodeCursor(cursor);
  return {
    OR: [
      { createdAt: { lt: new Date(createdAt) } },
      {
        createdAt: new Date(createdAt),
        id: { lt: id },
      },
    ],
  };
}
