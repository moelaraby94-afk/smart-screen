import { Transform } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

/**
 * Hard ceiling on how many rows one request may return.
 *
 * Not enforced with `@Max`: a client asking for more receives the ceiling rather
 * than a 400, and the response echoes the `limit` it actually got. The screens
 * endpoint already accepted `?limit=1000000` — `@Min(1)` with no upper bound —
 * so its pagination was decorative.
 *
 * 500 because two callers currently use the list endpoints as "fetch
 * everything" (useApiScreens asks for 500, the schedules picker for 200).
 * Lowering the ceiling before those screens paginate would silently truncate
 * them. It is a ceiling, not a page size — DEFAULT_PAGE_SIZE is what a caller
 * gets when it does not ask.
 */
export const MAX_PAGE_SIZE = 500;
export const DEFAULT_PAGE_SIZE = 50;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

function toPositiveInt(value: unknown, fallback: number): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) && parsed >= 1 ? Math.floor(parsed) : fallback;
}

export class PaginationQueryDto {
  @Transform(({ value }: { value: unknown }) =>
    value === undefined ? 1 : toPositiveInt(value, 1),
  )
  @IsInt()
  @Min(1)
  @IsOptional()
  page: number = 1;

  @Transform(({ value }: { value: unknown }) =>
    value === undefined
      ? DEFAULT_PAGE_SIZE
      : clamp(toPositiveInt(value, DEFAULT_PAGE_SIZE), 1, MAX_PAGE_SIZE),
  )
  @IsInt()
  @Min(1)
  @IsOptional()
  limit: number = DEFAULT_PAGE_SIZE;
}

/** Prisma `skip` for a 1-based page. */
export function skipFor(query: { page: number; limit: number }): number {
  return (query.page - 1) * query.limit;
}
