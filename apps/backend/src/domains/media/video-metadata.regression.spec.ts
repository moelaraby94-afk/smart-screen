import { toMediaResponse } from '../media/media.mapper';
import { isVideoMime, extractVideoMetadata, type VideoMetadata } from '../media/video-metadata';
import type { IStorageService } from '../../common/storage/storage.interface';

// ─── Helpers ─────────────────────────────────────────────────────────

function makeFakeStorage(): IStorageService {
  return {
    getPublicUrl: jest.fn((key: string) => `https://cdn.test/${key}`),
    upload: jest.fn(),
    delete: jest.fn(),
    copy: jest.fn(),
    exists: jest.fn(),
    move: jest.fn(),
    ensureDir: jest.fn(),
    getSignedUrl: jest.fn(() => Promise.resolve('')),
    providerName: 'test',
  } as unknown as IStorageService;
}

const EMPTY_META: VideoMetadata = {
  width: null,
  height: null,
  durationSec: null,
  rotation: null,
  codec: null,
  bitrate: null,
  frameRate: null,
};

// ─── Tests ───────────────────────────────────────────────────────────

describe('Video Metadata Pipeline (Phase 2)', () => {
  // ─── isVideoMime ──────────────────────────────────────────────────

  describe('isVideoMime', () => {
    it('returns true for video/mp4', () => {
      expect(isVideoMime('video/mp4')).toBe(true);
    });

    it('returns true for video/webm', () => {
      expect(isVideoMime('video/webm')).toBe(true);
    });

    it('returns true for video/quicktime', () => {
      expect(isVideoMime('video/quicktime')).toBe(true);
    });

    it('returns false for image/jpeg', () => {
      expect(isVideoMime('image/jpeg')).toBe(false);
    });

    it('returns false for image/png', () => {
      expect(isVideoMime('image/png')).toBe(false);
    });

    it('returns false for unknown mime', () => {
      expect(isVideoMime('application/octet-stream')).toBe(false);
    });
  });

  // ─── extractVideoMetadata — fault tolerance ───────────────────────

  describe('extractVideoMetadata fault tolerance', () => {
    it('returns all-null metadata for corrupted/invalid buffer', async () => {
      const warnings: string[] = [];
      const result = await extractVideoMetadata(Buffer.from('not a video'), {
        warn: (msg: string) => warnings.push(msg),
      });

      expect(result).toEqual(EMPTY_META);
      expect(warnings.length).toBeGreaterThan(0);
    });

    it('returns all-null metadata for empty buffer', async () => {
      const result = await extractVideoMetadata(Buffer.alloc(0));
      expect(result).toEqual(EMPTY_META);
    });

    it('never throws — always returns a VideoMetadata object', async () => {
      // Pass various invalid inputs
      const inputs = [
        Buffer.from(''),
        Buffer.from('garbage'),
        Buffer.from([0x00, 0x01, 0x02]),
      ];
      for (const buf of inputs) {
        const result = await extractVideoMetadata(buf);
        expect(result).toBeDefined();
        expect(result.width).toBeNull();
        expect(result.height).toBeNull();
      }
    });
  });

  // ─── Shared media mapper — video fields ───────────────────────────

  describe('toMediaResponse with video metadata', () => {
    const storage = makeFakeStorage();

    it('preserves all video metadata fields when present', () => {
      const result = toMediaResponse(
        {
          id: 'v1',
          workspaceId: 'ws-1',
          fileName: 'video.mp4',
          originalName: 'video.mp4',
          mimeType: 'video/mp4',
          sizeBytes: 5000000,
          width: 1920,
          height: 1080,
          durationSec: 30.5,
          rotation: 90,
          codec: 'h264',
          bitrate: 2500000,
          frameRate: 30,
          relativePath: 'ws-1/video.mp4',
          folderId: null,
          folder: null,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          expiresAt: null,
        },
        storage,
      );

      expect(result.width).toBe(1920);
      expect(result.height).toBe(1080);
      expect(result.durationSec).toBe(30.5);
      expect(result.rotation).toBe(90);
      expect(result.codec).toBe('h264');
      expect(result.bitrate).toBe(2500000);
      expect(result.frameRate).toBe(30);
    });

    it('returns null for video metadata fields when absent (image file)', () => {
      const result = toMediaResponse(
        {
          id: 'img1',
          workspaceId: 'ws-1',
          fileName: 'photo.jpg',
          originalName: 'photo.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 102400,
          width: 4000,
          height: 3000,
          relativePath: 'ws-1/photo.jpg',
          folderId: null,
          folder: null,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          expiresAt: null,
        },
        storage,
      );

      expect(result.width).toBe(4000);
      expect(result.height).toBe(3000);
      expect(result.durationSec).toBeNull();
      expect(result.rotation).toBeNull();
      expect(result.codec).toBeNull();
      expect(result.bitrate).toBeNull();
      expect(result.frameRate).toBeNull();
    });

    it('handles portrait video (height > width)', () => {
      const result = toMediaResponse(
        {
          id: 'v2',
          workspaceId: 'ws-1',
          fileName: 'portrait.mp4',
          originalName: 'portrait.mp4',
          mimeType: 'video/mp4',
          sizeBytes: 3000000,
          width: 1080,
          height: 1920,
          durationSec: 15.0,
          rotation: 0,
          codec: 'h264',
          bitrate: 2000000,
          frameRate: 24,
          relativePath: 'ws-1/portrait.mp4',
          folderId: null,
          folder: null,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          expiresAt: null,
        },
        storage,
      );

      expect(result.width).toBe(1080);
      expect(result.height).toBe(1920);
      expect(result.durationSec).toBe(15.0);
      expect(result.codec).toBe('h264');
    });

    it('handles landscape video (width > height)', () => {
      const result = toMediaResponse(
        {
          id: 'v3',
          workspaceId: 'ws-1',
          fileName: 'landscape.mp4',
          originalName: 'landscape.mp4',
          mimeType: 'video/webm',
          sizeBytes: 8000000,
          width: 3840,
          height: 2160,
          durationSec: 120.0,
          rotation: 0,
          codec: 'vp9',
          bitrate: 5000000,
          frameRate: 60,
          relativePath: 'ws-1/landscape.webm',
          folderId: null,
          folder: null,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          expiresAt: null,
        },
        storage,
      );

      expect(result.width).toBe(3840);
      expect(result.height).toBe(2160);
      expect(result.durationSec).toBe(120.0);
      expect(result.codec).toBe('vp9');
      expect(result.frameRate).toBe(60);
    });

    it('handles video with no detected metadata (extraction failed)', () => {
      const result = toMediaResponse(
        {
          id: 'v4',
          workspaceId: 'ws-1',
          fileName: 'unknown.mp4',
          originalName: 'unknown.mp4',
          mimeType: 'video/mp4',
          sizeBytes: 1000000,
          // All metadata fields absent — ffprobe failed
          relativePath: 'ws-1/unknown.mp4',
          folderId: null,
          folder: null,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          expiresAt: null,
        },
        storage,
      );

      // Upload succeeds, metadata is null
      expect(result.mimeType).toBe('video/mp4');
      expect(result.width).toBeNull();
      expect(result.height).toBeNull();
      expect(result.durationSec).toBeNull();
      expect(result.rotation).toBeNull();
      expect(result.codec).toBeNull();
      expect(result.bitrate).toBeNull();
      expect(result.frameRate).toBeNull();
    });
  });
});
