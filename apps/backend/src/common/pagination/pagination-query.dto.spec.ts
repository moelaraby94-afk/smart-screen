import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { buildPage } from './page';
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  PaginationQueryDto,
  skipFor,
} from './pagination-query.dto';

/**
 * `ListScreensDto.limit` was `@Min(1)` with no upper bound, so `?limit=1000000`
 * was accepted and Prisma took a million rows — the pagination was decorative.
 * These tests pin the clamp and the defaults.
 */
function parse(query: Record<string, unknown>): PaginationQueryDto {
  const dto = plainToInstance(PaginationQueryDto, query, {
    enableImplicitConversion: false,
  });
  const errors = validateSync(dto);
  expect(errors).toHaveLength(0);
  return dto;
}

describe('PaginationQueryDto', () => {
  it('defaults to page 1 and the default page size', () => {
    const dto = parse({});

    expect(dto.page).toBe(1);
    expect(dto.limit).toBe(DEFAULT_PAGE_SIZE);
  });

  it('clamps an absurd limit to the ceiling instead of rejecting it', () => {
    const dto = parse({ limit: '1000000' });

    expect(dto.limit).toBe(MAX_PAGE_SIZE);
  });

  it('accepts a limit at the ceiling', () => {
    expect(parse({ limit: String(MAX_PAGE_SIZE) }).limit).toBe(MAX_PAGE_SIZE);
  });

  it('parses numeric strings from the query string', () => {
    const dto = parse({ page: '3', limit: '25' });

    expect(dto.page).toBe(3);
    expect(dto.limit).toBe(25);
  });

  it.each([
    ['', 'empty string'],
    ['abc', 'non-numeric'],
    ['0', 'zero'],
    ['-5', 'negative'],
    ['2.7', 'fractional'],
  ])('falls back to a sane limit for %p (%s)', (limit) => {
    const dto = parse({ limit });

    expect(dto.limit).toBeGreaterThanOrEqual(1);
    expect(dto.limit).toBeLessThanOrEqual(MAX_PAGE_SIZE);
  });

  it('never yields a page below 1', () => {
    for (const page of ['0', '-3', 'abc', '']) {
      expect(parse({ page }).page).toBeGreaterThanOrEqual(1);
    }
  });

  it('computes skip from a 1-based page', () => {
    expect(skipFor({ page: 1, limit: 20 })).toBe(0);
    expect(skipFor({ page: 3, limit: 20 })).toBe(40);
  });
});

describe('buildPage', () => {
  it('echoes the effective limit so a clamped caller can tell', () => {
    const page = buildPage(['a'], 1000, { page: 1, limit: MAX_PAGE_SIZE });

    expect(page.limit).toBe(MAX_PAGE_SIZE);
    expect(page.total).toBe(1000);
    expect(page.totalPages).toBe(Math.ceil(1000 / MAX_PAGE_SIZE));
  });

  it('reports one page when the collection is empty', () => {
    const page = buildPage([], 0, { page: 1, limit: 50 });

    expect(page.items).toEqual([]);
    expect(page.total).toBe(0);
    expect(page.totalPages).toBe(1);
  });
});
