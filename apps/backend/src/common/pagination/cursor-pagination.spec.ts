import {
  encodeCursor,
  decodeCursor,
  resolveLimit,
  buildPaginatedResult,
  buildCursorWhere,
} from './cursor-pagination';

describe('CursorPagination', () => {
  describe('encodeCursor / decodeCursor', () => {
    it('round-trips correctly', () => {
      const id = 'clxxx123';
      const createdAt = new Date('2026-07-19T10:00:00Z');
      const encoded = encodeCursor({ id, createdAt });
      const decoded = decodeCursor(encoded);
      expect(decoded.id).toBe(id);
      expect(decoded.createdAt).toBe(createdAt.toISOString());
    });

    it('throws on invalid cursor', () => {
      expect(() => decodeCursor('invalid-base64!')).toThrow();
    });

    it('throws on missing fields', () => {
      const bad = Buffer.from(JSON.stringify({ id: 'x' })).toString('base64');
      expect(() => decodeCursor(bad)).toThrow();
    });
  });

  describe('resolveLimit', () => {
    it('returns default when undefined', () => {
      expect(resolveLimit(undefined)).toBe(20);
    });
    it('returns default when 0', () => {
      expect(resolveLimit(0)).toBe(20);
    });
    it('clamps to max 100', () => {
      expect(resolveLimit(200)).toBe(100);
    });
    it('returns valid limit', () => {
      expect(resolveLimit(50)).toBe(50);
    });
  });

  describe('buildPaginatedResult', () => {
    it('returns hasMore=false when items fit', () => {
      const items = Array.from({ length: 5 }, (_, i) => ({
        id: `id-${i}`,
        createdAt: new Date(2026, 6, 19 - i),
      }));
      const result = buildPaginatedResult(items, 20);
      expect(result.items).toHaveLength(5);
      expect(result.hasMore).toBe(false);
      expect(result.nextCursor).toBeNull();
    });

    it('returns hasMore=true and slices when items exceed limit', () => {
      const items = Array.from({ length: 25 }, (_, i) => ({
        id: `id-${i}`,
        createdAt: new Date(2026, 6, 19 - i),
      }));
      const result = buildPaginatedResult(items, 20);
      expect(result.items).toHaveLength(20);
      expect(result.hasMore).toBe(true);
      expect(result.nextCursor).not.toBeNull();
      const decoded = decodeCursor(result.nextCursor!);
      expect(decoded.id).toBe('id-19');
    });
  });

  describe('buildCursorWhere', () => {
    it('returns empty when no cursor', () => {
      expect(buildCursorWhere(undefined)).toEqual({});
    });

    it('returns OR condition with cursor', () => {
      const cursor = encodeCursor({
        id: 'clxxx',
        createdAt: new Date('2026-07-19T10:00:00Z'),
      });
      const where = buildCursorWhere(cursor);
      expect(where).toHaveProperty('OR');
      expect((where as { OR: unknown[] }).OR).toHaveLength(2);
    });
  });
});
