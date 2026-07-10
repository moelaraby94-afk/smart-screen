/**
 * The envelope every list endpoint returns.
 *
 * `total` is the count of *all* matching rows, not of `items` — the server
 * caps `limit`, so `items.length` is never a reliable count. Several screens
 * used to download an entire collection and read `.length`, which is both a
 * wrong number once the cap bites and a full table scan over the wire.
 */
export type Page<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

const EMPTY: Page<never> = {
  items: [],
  page: 1,
  limit: 0,
  total: 0,
  totalPages: 1,
};

function isPage(value: unknown): value is Page<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    Array.isArray((value as { items?: unknown }).items) &&
    typeof (value as { total?: unknown }).total === 'number'
  );
}

/** Reads the envelope. A malformed body yields an empty page rather than throwing. */
export async function readPage<T>(response: Response): Promise<Page<T>> {
  if (!response.ok) return EMPTY as Page<T>;

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    return EMPTY as Page<T>;
  }

  return isPage(body) ? (body as Page<T>) : (EMPTY as Page<T>);
}

/** When only the rows matter. */
export async function readPageItems<T>(response: Response): Promise<T[]> {
  return (await readPage<T>(response)).items;
}
