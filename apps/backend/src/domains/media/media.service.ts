import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Inject,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { DomainException } from '../../common/errors/domain.exception';
import { buildPage } from '../../common/pagination/page';
import { skipFor } from '../../common/pagination/pagination-query.dto';
import { ListMediaDto } from './dto/list-media.dto';
import { ErrorCode } from '../../common/errors/error-codes';
import { PrismaService } from '../../common/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PlatformEvents } from '../../common/events/platform-events';
import { STORAGE_SERVICE } from '../../common/storage/storage.interface';
import type { IStorageService } from '../../common/storage/storage.interface';
import { join } from 'path';
import { createHash, randomUUID } from 'crypto';
import { MediaFoldersService } from './media-folders.service';
import { toMediaResponse, type MediaResponse } from './media.mapper';
import { extractVideoMetadata, isVideoMime, type VideoMetadata } from './video-metadata';

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'video/mp4',
  'video/webm',
  'video/quicktime',
]);

const MAX_BYTES = 150 * 1024 * 1024;

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly eventEmitter: EventEmitter2,
    @Inject(STORAGE_SERVICE) private readonly storage: IStorageService,
    private readonly foldersService: MediaFoldersService,
  ) {}

  getPublicBaseUrl(): string {
    return (
      this.config.get<string>('MEDIA_PUBLIC_BASE_URL') ??
      `http://localhost:${this.config.get<string>('PORT', '3000')}`
    );
  }

  buildPublicUrl(relativePath: string): string {
    return this.storage.getPublicUrl(relativePath);
  }

  ensureUploadDir(workspaceId: string): string {
    /**
     * Delegates to the storage abstraction. For local storage, this creates
     * the workspace directory. For S3, it's a no-op.
     */
    this.storage.ensureDir(workspaceId);
    return '';
  }

  /**
   * Serializes the read-then-write quota check per workspace, so two concurrent
   * uploads cannot both observe the same "used so far" total, both pass, and
   * jointly land over the limit. The advisory lock is scoped to the transaction
   * and keyed on the workspace, so other workspaces are never blocked.
   *
   * Keep the surrounding transaction short: it must not contain disk I/O (see
   * `saveUploadedFile`). Prisma's interactive transactions time out after 5s by
   * default, and this lock is held for the whole transaction.
   */
  private async assertWithinStorageQuotaTx(
    tx: Prisma.TransactionClient,
    workspaceId: string,
    additionalBytes: number,
  ): Promise<void> {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${workspaceId}))`;

    const sub = await tx.subscription.findUnique({
      where: { workspaceId },
      select: { storageLimitBytes: true },
    });
    if (sub?.storageLimitBytes == null) return;

    const agg = await tx.media.aggregate({
      where: { workspaceId },
      _sum: { sizeBytes: true },
    });
    const used = BigInt(agg._sum.sizeBytes ?? 0);
    if (used + BigInt(additionalBytes) > sub.storageLimitBytes) {
      throw DomainException.payloadTooLarge(
        ErrorCode.STORAGE_QUOTA_EXCEEDED,
        'Storage quota exceeded',
        {
          storageUsed: Number(used),
          storageLimit: Number(sub.storageLimitBytes),
        },
      );
    }
  }

  async saveUploadedFile(params: {
    ownerId: string;
    workspaceId: string | null;
    buffer: Buffer;
    originalName: string;
    mimeType: string;
    size: number;
    folderId?: string | null;
  }) {
    if (!ALLOWED_MIME.has(params.mimeType)) {
      throw new BadRequestException(
        `Unsupported file type: ${params.mimeType}`,
      );
    }
    /** The declared size is client-controlled; the buffer length is not. */
    const sizeBytes = params.buffer.length;
    if (sizeBytes > MAX_BYTES) {
      throw DomainException.badRequest(
        ErrorCode.FILE_TOO_LARGE,
        'File exceeds maximum allowed size',
        { maxBytes: MAX_BYTES, sizeBytes },
      );
    }

    /**
     * The declared mimeType/extension above are client-controlled and prove
     * nothing. Sniff the actual magic bytes and only trust that — a text
     * file renamed to .png must still be rejected here, before anything
     * touches disk (the upload is buffered in memory by multer, so there is
     * no temp file to clean up on rejection).
     *
     * `file-type` is pure ESM, so it can only be reached from this CommonJS
     * build through a dynamic import (tsconfig `module: nodenext` preserves it
     * rather than lowering it to `require`). Jest resolves it via
     * moduleNameMapper to a CJS mock.
     */
    const { fileTypeFromBuffer } = await import('file-type');
    const detected = await fileTypeFromBuffer(params.buffer);
    if (!detected || !ALLOWED_MIME.has(detected.mime)) {
      throw DomainException.badRequest(
        ErrorCode.UNSUPPORTED_FILE_TYPE,
        'File content does not match an allowed image/video type',
        {
          declared: params.mimeType,
          detected: detected?.mime ?? 'unrecognized',
        },
      );
    }

    const wsId = params.workspaceId ?? '_account';

    // EXIF stripping for images: preserve orientation only
    let uploadBuffer = params.buffer;
    const IMAGE_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp']);
    let detectedWidth: number | null = null;
    let detectedHeight: number | null = null;
    if (IMAGE_MIMES.has(detected.mime)) {
      try {
        const sharp = (await import('sharp')).default;
        const metadata = await sharp(params.buffer).metadata();
        detectedWidth = metadata.width ?? null;
        detectedHeight = metadata.height ?? null;
        uploadBuffer = await sharp(params.buffer).rotate().toBuffer();
      } catch {
        // sharp failed — use original buffer
      }
    }

    // Video metadata extraction via ffprobe (fault-tolerant)
    let videoMeta: VideoMetadata = {
      width: null,
      height: null,
      durationSec: null,
      rotation: null,
      codec: null,
      bitrate: null,
      frameRate: null,
    };
    if (isVideoMime(detected.mime)) {
      videoMeta = await extractVideoMetadata(params.buffer, {
        warn: (msg: string) => this.logger?.warn?.(msg),
      });
      if (videoMeta.width) detectedWidth = videoMeta.width;
      if (videoMeta.height) detectedHeight = videoMeta.height;
    }

    // SHA-256 file hash for integrity checking
    const fileHash = createHash('sha256').update(uploadBuffer).digest('hex');

    let effectiveFolderId = params.folderId ?? null;

    if (effectiveFolderId) {
      const folder = await this.prisma.mediaFolder.findFirst({
        where: { id: effectiveFolderId, ownerId: params.ownerId },
        select: { id: true },
      });
      if (!folder) {
        throw new BadRequestException('Folder not found');
      }
    } else if (params.workspaceId) {
      const defaultFolder = await this.prisma.mediaFolder.findFirst({
        where: { workspaceId: params.workspaceId, isDefault: true },
        select: { id: true },
      });
      if (defaultFolder) {
        effectiveFolderId = defaultFolder.id;
      }
    }

    this.ensureUploadDir(wsId);
    const ext = `.${detected.ext}`;
    const fileName = `${randomUUID()}${ext}`;
    const relativePath = join(wsId, fileName).replace(/\\/g, '/');
    const tempKey = `${relativePath}.part`;

    /**
     * The bytes land in storage *before* the transaction opens, under a temporary
     * key (same location, so the final `move` is atomic for local / copy+delete
     * for S3).
     *
     * Writing inside the transaction instead would hold both the advisory lock
     * and a Postgres connection for the duration of a write of up to
     * MAX_BYTES — blowing Prisma's 5s interactive-transaction timeout on large
     * uploads — and a rollback would leave the object behind, since the
     * storage does not participate in the transaction.
     */
    await this.storage.upload(tempKey, uploadBuffer);

    let created: Awaited<ReturnType<typeof this.prisma.media.create>>;
    try {
      created = await this.prisma.$transaction(async (tx) => {
        if (params.workspaceId) {
          await this.assertWithinStorageQuotaTx(
            tx,
            params.workspaceId,
            sizeBytes,
          );
        }
        return tx.media.create({
          data: {
            ownerId: params.ownerId,
            workspaceId: params.workspaceId ?? undefined,
            fileName,
            originalName: params.originalName,
            // Store the sniffed, verified type — not the client-supplied header.
            mimeType: detected.mime,
            sizeBytes,
            relativePath,
            folderId: effectiveFolderId,
            fileHash,
            width: detectedWidth,
            height: detectedHeight,
            durationSec: videoMeta.durationSec,
            rotation: videoMeta.rotation,
            codec: videoMeta.codec,
            bitrate: videoMeta.bitrate,
            frameRate: videoMeta.frameRate,
          },
        });
      });
    } catch (err) {
      await this.discardTempFile(tempKey);
      throw err;
    }

    try {
      await this.storage.move(tempKey, relativePath);
    } catch (err) {
      // The row is committed but its bytes never arrived — undo the row so the
      // quota total and the library never reference a file that is not there.
      await this.prisma.media
        .delete({ where: { id: created.id } })
        .catch(() => {
          /* best effort: the row is already orphaned, don't mask the real error */
        });
      await this.discardTempFile(tempKey);
      throw err;
    }

    if (params.workspaceId) {
      this.eventEmitter.emit(PlatformEvents.UPLOAD_COMPLETE, {
        workspaceId: params.workspaceId,
        payload: { fileName: params.originalName },
      });
    }

    return created;
  }

  private async discardTempFile(tempKey: string): Promise<void> {
    await this.storage.delete(tempKey).catch(() => {
      /* already gone, or never created */
    });
  }

  async list(ownerId: string, query: ListMediaDto) {
    const where: Prisma.MediaWhereInput = {
      ownerId,
      ...(query.workspaceId ? { workspaceId: query.workspaceId } : {}),
      ...(query.folderId ? { folderId: query.folderId } : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.media.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: { folder: true },
        skip: skipFor(query),
        take: query.limit,
      }),
      this.prisma.media.count({ where }),
    ]);

    let storageUsed: number | null = null;
    let storageLimit: number | null = null;
    if (query.workspaceId) {
      const [agg, sub] = await Promise.all([
        this.prisma.media.aggregate({
          where: { workspaceId: query.workspaceId },
          _sum: { sizeBytes: true },
        }),
        this.prisma.subscription.findUnique({
          where: { workspaceId: query.workspaceId },
          select: { storageLimitBytes: true },
        }),
      ]);
      storageUsed = Number(agg._sum.sizeBytes ?? 0);
      storageLimit =
        sub?.storageLimitBytes != null ? Number(sub.storageLimitBytes) : null;
    }

    return {
      ...buildPage(
        items.map((m) => this.toResponse(m)),
        total,
        query,
      ),
      ...(storageUsed !== null ? { storageUsed } : {}),
      ...(storageLimit !== null ? { storageLimit } : {}),
    };
  }

  /**
   * Aggregate counted in the database.
   *
   * `overview-metrics.tsx` used to download the whole media list and compute
   * `arr.length` and `arr.reduce((a, m) => a + m.sizeBytes, 0)` in the browser —
   * a full table scan over the wire to render two numbers.
   */
  async stats(
    ownerId: string,
    workspaceId?: string,
  ): Promise<{
    count: number;
    storageBytes: number;
  }> {
    const where: Prisma.MediaWhereInput = { ownerId };
    if (workspaceId) where.workspaceId = workspaceId;
    const [count, aggregate] = await Promise.all([
      this.prisma.media.count({ where }),
      this.prisma.media.aggregate({
        where,
        _sum: { sizeBytes: true },
      }),
    ]);
    return { count, storageBytes: aggregate._sum.sizeBytes ?? 0 };
  }

  async getById(workspaceId: string, id: string) {
    const media = await this.prisma.media.findFirst({
      where: { id, workspaceId },
      include: { folder: true },
    });
    if (!media) throw new NotFoundException('Media not found');
    return this.toResponse(media);
  }

  async getMediaUrl(workspaceId: string, id: string): Promise<{ url: string }> {
    const media = await this.prisma.media.findFirst({
      where: { id, workspaceId },
      select: { id: true, relativePath: true },
    });
    if (!media) throw new NotFoundException('Media not found');
    const url = await this.storage.getSignedUrl(media.relativePath, 3600);
    return { url };
  }

  /**
   * Copy a media file into another workspace (new DB row + file on disk).
   * Used when cloning playlists across branches.
   *
   * This counts against the *target* workspace's storage quota exactly like a
   * direct upload does. Skipping the check here would let a workspace exceed
   * its paid limit simply by cloning playlists between its own branches.
   */
  async duplicateMediaToWorkspace(params: {
    sourceWorkspaceId: string;
    mediaId: string;
    targetWorkspaceId: string;
  }): Promise<{ id: string }> {
    const media = await this.prisma.media.findFirst({
      where: {
        id: params.mediaId,
        workspaceId: params.sourceWorkspaceId,
      },
    });
    if (!media) throw new NotFoundException('Media not found');

    const srcExists = await this.storage.exists(media.relativePath);
    if (!srcExists) {
      throw DomainException.badRequest(
        ErrorCode.MEDIA_FILE_MISSING,
        'Media file is missing in storage',
      );
    }

    this.ensureUploadDir(params.targetWorkspaceId);
    const ext = this.safeExt(media.originalName, media.mimeType);
    const fileName = `${randomUUID()}${ext}`;
    const relativePath = join(params.targetWorkspaceId, fileName).replace(
      /\\/g,
      '/',
    );
    const tempKey = `${relativePath}.part`;

    // Same temp-then-move ordering as saveUploadedFile: the copy happens
    // outside the transaction, and only a move follows the commit.
    await this.storage.copy(media.relativePath, tempKey);

    let created: { id: string };
    try {
      created = await this.prisma.$transaction(async (tx) => {
        await this.assertWithinStorageQuotaTx(
          tx,
          params.targetWorkspaceId,
          media.sizeBytes,
        );
        return tx.media.create({
          data: {
            ownerId: media.ownerId,
            workspaceId: params.targetWorkspaceId,
            fileName,
            originalName: media.originalName,
            mimeType: media.mimeType,
            sizeBytes: media.sizeBytes,
            relativePath,
            folderId: null,
          },
          select: { id: true },
        });
      });
    } catch (err) {
      await this.discardTempFile(tempKey);
      throw err;
    }

    try {
      await this.storage.move(tempKey, relativePath);
    } catch (err) {
      await this.prisma.media
        .delete({ where: { id: created.id } })
        .catch(() => {
          /* best effort */
        });
      await this.discardTempFile(tempKey);
      throw err;
    }

    return created;
  }

  async remove(workspaceId: string, id: string): Promise<void> {
    const media = await this.prisma.media.findFirst({
      where: { id, workspaceId },
    });
    if (!media) throw new NotFoundException('Media not found');

    const used = await this.prisma.playlistItem.count({
      where: { mediaId: id },
    });
    if (used > 0) {
      throw DomainException.badRequest(
        ErrorCode.MEDIA_IN_USE,
        'Media is referenced by playlists',
        { playlistItemCount: used },
      );
    }

    await this.prisma.media.delete({ where: { id } });
    await this.storage.delete(media.relativePath).catch(() => {
      /* file already gone */
    });
  }

  async listFolders(ownerId: string, workspaceId?: string) {
    return this.foldersService.listFolders(ownerId, workspaceId);
  }

  async createFolder(
    ownerId: string,
    workspaceId: string | null,
    name: string,
  ) {
    return this.foldersService.createFolder(ownerId, workspaceId, name);
  }

  async renameFolder(
    ownerId: string,
    workspaceId: string | null,
    folderId: string,
    name: string,
  ) {
    return this.foldersService.renameFolder(
      ownerId,
      workspaceId,
      folderId,
      name,
    );
  }

  async deleteFolder(
    ownerId: string,
    workspaceId: string | null,
    folderId: string,
  ) {
    return this.foldersService.deleteFolder(ownerId, workspaceId, folderId);
  }

  async moveMediaToFolder(
    workspaceId: string,
    mediaId: string,
    folderId: string | null,
  ) {
    return this.foldersService.moveMediaToFolder(
      workspaceId,
      mediaId,
      folderId,
    );
  }

  async setExpiry(
    workspaceId: string,
    mediaId: string,
    expiresAt: string | null,
  ) {
    const media = await this.prisma.media.findFirst({
      where: { id: mediaId, workspaceId },
      select: { id: true },
    });
    if (!media) throw new NotFoundException('Media not found');
    const expiry = expiresAt ? new Date(expiresAt) : null;
    const updated = await this.prisma.media.update({
      where: { id: mediaId },
      data: { expiresAt: expiry },
      include: { folder: true },
    });
    return updated;
  }

  toResponse(media: {
    id: string;
    workspaceId: string | null;
    fileName: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    relativePath: string;
    folderId?: string | null;
    folder?: { id: string; name: string } | null;
    width?: number | null;
    height?: number | null;
    durationSec?: number | null;
    rotation?: number | null;
    codec?: string | null;
    bitrate?: number | null;
    frameRate?: number | null;
    createdAt: Date;
    updatedAt: Date;
    expiresAt?: Date | null;
  }): MediaResponse {
    return toMediaResponse(media, this.storage);
  }

  private safeExt(originalName: string, mime: string): string {
    const lower = originalName.toLowerCase();
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return '.jpg';
    if (lower.endsWith('.png')) return '.png';
    if (lower.endsWith('.gif')) return '.gif';
    if (lower.endsWith('.webp')) return '.webp';
    if (lower.endsWith('.mp4')) return '.mp4';
    if (lower.endsWith('.webm')) return '.webm';
    if (lower.endsWith('.mov')) return '.mov';
    if (mime === 'image/jpeg') return '.jpg';
    if (mime === 'image/png') return '.png';
    if (mime === 'video/mp4') return '.mp4';
    return '';
  }
}
