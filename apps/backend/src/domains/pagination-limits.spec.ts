/**
 * Regression tests for F-03: unbounded list endpoints.
 *
 * Verifies that the MAX_PAGE_SIZE constant used as a safety cap
 * on members, invites, assignments, analytics, and overlaps queries
 * is defined and reasonable.
 */

import {
  MAX_PAGE_SIZE,
  DEFAULT_PAGE_SIZE,
} from '../common/pagination/pagination-query.dto';

describe('F-03: Unbounded list endpoint safety caps', () => {
  it('MAX_PAGE_SIZE is defined and reasonable (<= 500)', () => {
    expect(typeof MAX_PAGE_SIZE).toBe('number');
    expect(MAX_PAGE_SIZE).toBeGreaterThan(0);
    expect(MAX_PAGE_SIZE).toBeLessThanOrEqual(500);
  });

  it('MAX_PAGE_SIZE is at least as large as the default page size', () => {
    expect(MAX_PAGE_SIZE).toBeGreaterThanOrEqual(DEFAULT_PAGE_SIZE);
  });
});
