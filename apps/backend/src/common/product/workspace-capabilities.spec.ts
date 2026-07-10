import { computeWorkspaceCapabilities } from './workspace-capabilities';

describe('computeWorkspaceCapabilities', () => {
  describe('screens', () => {
    it('allows creation below the limit and reports what is left', () => {
      const caps = computeWorkspaceCapabilities(
        { screenCount: 3, storageUsedBytes: 0 },
        { screenLimit: 25, storageLimitBytes: null },
      );

      expect(caps.screens.remaining).toBe(22);
      expect(caps.screens.canCreate).toBe(true);
    });

    it('blocks creation exactly at the limit', () => {
      const caps = computeWorkspaceCapabilities(
        { screenCount: 25, storageUsedBytes: 0 },
        { screenLimit: 25, storageLimitBytes: null },
      );

      expect(caps.screens.remaining).toBe(0);
      expect(caps.screens.canCreate).toBe(false);
    });

    it('never reports negative remaining when already over the limit', () => {
      const caps = computeWorkspaceCapabilities(
        { screenCount: 30, storageUsedBytes: 0 },
        { screenLimit: 25, storageLimitBytes: null },
      );

      expect(caps.screens.remaining).toBe(0);
      expect(caps.screens.canCreate).toBe(false);
    });

    it('treats a null screen limit as unlimited', () => {
      const caps = computeWorkspaceCapabilities(
        { screenCount: 9999, storageUsedBytes: 0 },
        { screenLimit: null, storageLimitBytes: null },
      );

      expect(caps.screens.remaining).toBeNull();
      expect(caps.screens.canCreate).toBe(true);
    });
  });

  describe('storage', () => {
    const GB = 1024 * 1024 * 1024;

    it('reports a rounded percentage and remaining bytes', () => {
      const caps = computeWorkspaceCapabilities(
        { screenCount: 0, storageUsedBytes: GB },
        { screenLimit: null, storageLimitBytes: 4 * GB },
      );

      expect(caps.storage.usedPct).toBe(25);
      expect(caps.storage.remainingBytes).toBe(3 * GB);
      expect(caps.storage.canUpload).toBe(true);
    });

    it('caps the percentage at 100 when over quota', () => {
      const caps = computeWorkspaceCapabilities(
        { screenCount: 0, storageUsedBytes: 6 * GB },
        { screenLimit: null, storageLimitBytes: 5 * GB },
      );

      expect(caps.storage.usedPct).toBe(100);
      expect(caps.storage.remainingBytes).toBe(0);
      expect(caps.storage.canUpload).toBe(false);
    });

    it('blocks upload exactly at the quota', () => {
      const caps = computeWorkspaceCapabilities(
        { screenCount: 0, storageUsedBytes: 5 * GB },
        { screenLimit: null, storageLimitBytes: 5 * GB },
      );

      expect(caps.storage.canUpload).toBe(false);
    });

    it('treats a null storage limit as unlimited', () => {
      const caps = computeWorkspaceCapabilities(
        { screenCount: 0, storageUsedBytes: 999 * GB },
        { screenLimit: null, storageLimitBytes: null },
      );

      expect(caps.storage.usedPct).toBeNull();
      expect(caps.storage.remainingBytes).toBeNull();
      expect(caps.storage.canUpload).toBe(true);
    });

    it('reports 100% for any usage against a zero limit', () => {
      const caps = computeWorkspaceCapabilities(
        { screenCount: 0, storageUsedBytes: 10 },
        { screenLimit: null, storageLimitBytes: 0 },
      );

      expect(caps.storage.usedPct).toBe(100);
      expect(caps.storage.canUpload).toBe(false);
    });
  });
});
