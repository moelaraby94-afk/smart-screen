import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { DomainException } from '../../common/errors/domain.exception';
import { ErrorCode } from '../../common/errors/error-codes';
import { ConfigService } from '@nestjs/config';
import { MediaService } from './media.service';
import { MediaFoldersService } from './media-folders.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LocalStorageService } from '../../common/storage/local-storage.service';

const mockHeartbeat = {
  emit: () => {},
} as unknown as EventEmitter2;

function makeStorage(uploadRoot: string): LocalStorageService {
  return new LocalStorageService({
    get: (key: string, def?: unknown) =>
      key === 'MEDIA_UPLOAD_DIR' ? uploadRoot : def,
  } as unknown as ConfigService);
}

describe('MediaService.buildPublicUrl', () => {
  it('points at the actual uploadRoot (uploads/media), not just uploads/', () => {
    const config = {
      get: (_key: string, def?: unknown) => def,
    } as unknown as ConfigService;
    const storage = makeStorage(join(process.cwd(), 'uploads', 'media'));
    const service = new MediaService(
      {} as PrismaService,
      config,
      mockHeartbeat,
      storage,
      {} as MediaFoldersService,
    );

    const url = service.buildPublicUrl('ws_1/file.png');

    // Regression check: previously this returned `.../media-files/ws_1/file.png`,
    // which 404s because main.ts serves the whole `uploads/` dir while the file
    // physically lives under `uploads/media/`.
    expect(url).toBe('http://localhost:3000/media-files/media/ws_1/file.png');
  });

  it('respects a MEDIA_UPLOAD_DIR override that stays under uploads/', () => {
    const config = {
      get: (key: string, def?: unknown) => def,
    } as unknown as ConfigService;
    const storage = makeStorage(join(process.cwd(), 'uploads', 'custom'));
    const service = new MediaService(
      {} as PrismaService,
      config,
      mockHeartbeat,
      storage,
      {} as MediaFoldersService,
    );

    const url = service.buildPublicUrl('ws_1/file.png');

    expect(url).toBe('http://localhost:3000/media-files/custom/ws_1/file.png');
  });
});

/** A real 1x1 PNG — `file-type` sniffs the actual magic bytes, so this must be genuine. */
const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
);

const WORKSPACE_ID = 'ws_1';

describe('MediaService storage quota + write ordering', () => {
  let uploadRoot: string;

  beforeEach(() => {
    uploadRoot = mkdtempSync(join(tmpdir(), 'cs-media-'));
  });

  afterEach(() => {
    rmSync(uploadRoot, { recursive: true, force: true });
  });

  const workspaceDir = () => join(uploadRoot, WORKSPACE_ID);

  const filesInWorkspace = (): string[] =>
    existsSync(workspaceDir()) ? readdirSync(workspaceDir()) : [];

  function buildService(opts: {
    storageLimitBytes: bigint | null;
    usedBytes?: number;
    /** Runs inside the transaction, before the quota check resolves. */
    onTransaction?: () => void;
    createImpl?: () => unknown;
  }) {
    const mediaCreate = jest.fn(
      opts.createImpl ??
        (() => ({ id: 'media_1', relativePath: `${WORKSPACE_ID}/x.png` })),
    );
    const mediaDelete = jest.fn().mockResolvedValue({});

    const tx = {
      $executeRaw: jest.fn(),
      subscription: {
        findUnique: jest
          .fn()
          .mockResolvedValue(
            opts.storageLimitBytes === null
              ? { storageLimitBytes: null }
              : { storageLimitBytes: opts.storageLimitBytes },
          ),
      },
      media: {
        aggregate: jest
          .fn()
          .mockResolvedValue({ _sum: { sizeBytes: opts.usedBytes ?? 0 } }),
        create: mediaCreate,
      },
    };

    const prisma = {
      $transaction: jest.fn(async (cb: (t: typeof tx) => Promise<unknown>) => {
        opts.onTransaction?.();
        return cb(tx);
      }),
      media: {
        delete: mediaDelete,
        findFirst: jest.fn(),
      },
      mediaFolder: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
    } as unknown as PrismaService;

    const storage = makeStorage(uploadRoot);
    const service = new MediaService(
      prisma,
      {
        get: (key: string, def?: unknown) =>
          key === 'MEDIA_UPLOAD_DIR' ? uploadRoot : def,
      } as unknown as ConfigService,
      mockHeartbeat,
      storage,
      {} as MediaFoldersService,
    );

    return { service, prisma, tx, mediaCreate, mediaDelete };
  }

  const upload = (service: MediaService) =>
    service.saveUploadedFile({
      ownerId: 'user_1',
      workspaceId: WORKSPACE_ID,
      buffer: PNG_1X1,
      originalName: 'pixel.png',
      mimeType: 'image/png',
      size: PNG_1X1.length,
    });

  it('stores the file and leaves no temporary artefact behind', async () => {
    const { service } = buildService({ storageLimitBytes: 1_000_000n });

    await upload(service);

    const files = filesInWorkspace();
    expect(files).toHaveLength(1);
    expect(files[0]).toMatch(/\.png$/);
    expect(files.some((f) => f.endsWith('.part'))).toBe(false);
  });

  /**
   * The bytes must already be on disk before the transaction opens. Writing
   * inside it holds the advisory lock and a Postgres connection across a disk
   * write of up to 150MB, which blows Prisma's 5s interactive-transaction
   * timeout and cannot be rolled back.
   */
  it('writes the file before opening the transaction, not inside it', async () => {
    let partExistedAtTxStart = false;

    const { service } = buildService({
      storageLimitBytes: 1_000_000n,
      onTransaction: () => {
        partExistedAtTxStart = filesInWorkspace().some((f) =>
          f.endsWith('.part'),
        );
      },
    });

    await upload(service);

    expect(partExistedAtTxStart).toBe(true);
  });

  it('rejects an upload that would exceed the quota and removes the temp file', async () => {
    const { service, mediaCreate } = buildService({
      storageLimitBytes: BigInt(PNG_1X1.length), // exactly full already
      usedBytes: PNG_1X1.length,
    });

    const error = await upload(service).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(DomainException);
    expect((error as DomainException).code).toBe(
      ErrorCode.STORAGE_QUOTA_EXCEEDED,
    );

    expect(mediaCreate).not.toHaveBeenCalled();
    expect(filesInWorkspace()).toHaveLength(0);
  });

  it('admits an upload that exactly reaches the quota', async () => {
    const { service } = buildService({
      storageLimitBytes: BigInt(PNG_1X1.length),
      usedBytes: 0,
    });

    await expect(upload(service)).resolves.toMatchObject({ id: 'media_1' });
    expect(filesInWorkspace()).toHaveLength(1);
  });

  it('skips the quota check when the workspace has no storage limit', async () => {
    const { service, tx } = buildService({ storageLimitBytes: null });

    await upload(service);

    expect(tx.media.aggregate).not.toHaveBeenCalled();
    expect(filesInWorkspace()).toHaveLength(1);
  });

  it('takes the per-workspace advisory lock before reading the used total', async () => {
    const { service, tx } = buildService({ storageLimitBytes: 1_000_000n });

    await upload(service);

    const lockOrder = tx.$executeRaw.mock.invocationCallOrder[0];
    const aggregateOrder = tx.media.aggregate.mock.invocationCallOrder[0];
    expect(lockOrder).toBeLessThan(aggregateOrder);
  });

  it('rolls back the DB row if the file cannot be moved into place', async () => {
    const { service, mediaDelete } = buildService({
      storageLimitBytes: 1_000_000n,
      // Deleting the temp file mid-transaction makes the post-commit rename fail.
      createImpl: () => {
        for (const f of filesInWorkspace()) {
          rmSync(join(workspaceDir(), f));
        }
        return { id: 'media_1' };
      },
    });

    await expect(upload(service)).rejects.toThrow();

    expect(mediaDelete).toHaveBeenCalledWith({ where: { id: 'media_1' } });
    expect(filesInWorkspace()).toHaveLength(0);
  });

  it('rejects a file whose bytes do not match an allowed type', async () => {
    const { service } = buildService({ storageLimitBytes: 1_000_000n });

    await expect(
      service.saveUploadedFile({
        ownerId: 'user_1',
        workspaceId: WORKSPACE_ID,
        buffer: Buffer.from('<html><script>alert(1)</script></html>'),
        originalName: 'evil.png',
        mimeType: 'image/png',
        size: 38,
      }),
    ).rejects.toThrow(/does not match an allowed/);

    expect(filesInWorkspace()).toHaveLength(0);
  });

  describe('duplicateMediaToWorkspace', () => {
    const SOURCE_WS = 'ws_source';
    const TARGET_WS = 'ws_target';

    function seedSourceFile(): { relativePath: string; sizeBytes: number } {
      const dir = join(uploadRoot, SOURCE_WS);
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, 'src.png'), PNG_1X1);
      return {
        relativePath: `${SOURCE_WS}/src.png`,
        sizeBytes: PNG_1X1.length,
      };
    }

    function buildDuplicateService(
      storageLimitBytes: bigint,
      usedBytes: number,
    ) {
      const source = seedSourceFile();
      const mediaCreate = jest.fn(() => ({ id: 'copy_1' }));

      const tx = {
        $executeRaw: jest.fn(),
        subscription: {
          findUnique: jest.fn().mockResolvedValue({ storageLimitBytes }),
        },
        media: {
          aggregate: jest
            .fn()
            .mockResolvedValue({ _sum: { sizeBytes: usedBytes } }),
          create: mediaCreate,
        },
      };

      const prisma = {
        $transaction: jest.fn(async (cb: (t: typeof tx) => Promise<unknown>) =>
          cb(tx),
        ),
        media: {
          findFirst: jest.fn().mockResolvedValue({
            id: 'src_1',
            workspaceId: SOURCE_WS,
            originalName: 'src.png',
            mimeType: 'image/png',
            sizeBytes: source.sizeBytes,
            relativePath: source.relativePath,
          }),
          delete: jest.fn(),
        },
      } as unknown as PrismaService;

      const storage = makeStorage(uploadRoot);
      const service = new MediaService(
        prisma,
        {
          get: (key: string, def?: unknown) =>
            key === 'MEDIA_UPLOAD_DIR' ? uploadRoot : def,
        } as unknown as ConfigService,
        mockHeartbeat,
        storage,
        {} as MediaFoldersService,
      );

      return { service, mediaCreate };
    }

    const targetFiles = () =>
      existsSync(join(uploadRoot, TARGET_WS))
        ? readdirSync(join(uploadRoot, TARGET_WS))
        : [];

    it('copies into the target workspace when the quota allows it', async () => {
      const { service } = buildDuplicateService(1_000_000n, 0);

      await expect(
        service.duplicateMediaToWorkspace({
          sourceWorkspaceId: SOURCE_WS,
          mediaId: 'src_1',
          targetWorkspaceId: TARGET_WS,
        }),
      ).resolves.toEqual({ id: 'copy_1' });

      expect(targetFiles()).toHaveLength(1);
      expect(targetFiles().some((f) => f.endsWith('.part'))).toBe(false);
    });

    /**
     * Regression: duplication used to skip the quota check entirely, so a
     * workspace could exceed its paid storage limit just by cloning playlists
     * between its own branches.
     */
    it('enforces the target workspace quota and cleans up on rejection', async () => {
      const { service, mediaCreate } = buildDuplicateService(
        BigInt(PNG_1X1.length),
        PNG_1X1.length,
      );

      const error = await service
        .duplicateMediaToWorkspace({
          sourceWorkspaceId: SOURCE_WS,
          mediaId: 'src_1',
          targetWorkspaceId: TARGET_WS,
        })
        .catch((e: unknown) => e);
      expect(error).toBeInstanceOf(DomainException);
      expect((error as DomainException).code).toBe(
        ErrorCode.STORAGE_QUOTA_EXCEEDED,
      );

      expect(mediaCreate).not.toHaveBeenCalled();
      expect(targetFiles()).toHaveLength(0);
    });
  });
});
