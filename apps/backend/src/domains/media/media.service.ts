import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { DomainException } from '../../common/errors/domain.exception';
import { buildPage } from '../../common/pagination/page';
import { skipFor } from '../../common/pagination/pagination-query.dto';
import { ListMediaDto } from './dto/list-media.dto';
import { ErrorCode } from '../../common/errors/error-codes';
import { PrismaService } from '../../common/prisma/prisma.service';
import { existsSync, mkdirSync, unlinkSync } from 'fs';
import { copyFile, rename, unlink, writeFile } from 'fs/promises';
import { join, relative } from 'path';
import { randomUUID } from 'crypto';

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
  private readonly uploadRoot: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.uploadRoot = this.config.get<string>(
      'MEDIA_UPLOAD_DIR',
      join(process.cwd(), 'uploads', 'media'),
    );
  }

  getPublicBaseUrl(): string {
    return (
      this.config.get<string>('MEDIA_PUBLIC_BASE_URL') ??
      `http://localhost:${this.config.get<string>('PORT', '3000')}`
    );
  }

  /**
   * main.ts serves static files from `uploads/` (whole directory) under the
   * `/media-files/` prefix, but files are actually written under
   * `uploadRoot` (default `uploads/media/`, overridable via
   * MEDIA_UPLOAD_DIR). Derive that gap here instead of hardcoding "media" —
   * this is exactly what drifted out of sync last time.
   */
  buildPublicUrl(relativePath: string): string {
    const base = this.getPublicBaseUrl().replace(/\/$/, '');
    const staticRoot = join(process.cwd(), 'uploads');
    const uploadRootPrefix = relative(staticRoot, this.uploadRoot).replace(
      /\\/g,
      '/',
    );
    const fullRelativePath = uploadRootPrefix
      ? `${uploadRootPrefix}/${relativePath}`
      : relativePath;
    const segments = fullRelativePath
      .split('/')
      .map(encodeURIComponent)
      .join('/');
    return `${base}/media-files/${segments}`;
  }

  ensureUploadDir(workspaceId: string): string {
    const dir = join(this.uploadRoot, workspaceId);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    return dir;
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
      throw DomainException.forbidden(
        ErrorCode.STORAGE_LIMIT_REACHED,
        'Workspace storage limit reached',
        {
          limitBytes: Number(sub.storageLimitBytes),
          usedBytes: Number(used),
          requestedBytes: additionalBytes,
        },
      );
    }
  }

  async saveUploadedFile(params: {
    workspaceId: string;
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
     * rather than lowering it to `require`). Jest needs
     * `--experimental-vm-modules` to execute that import — see the backend's
     * `test` script.
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

    if (params.folderId) {
      const folder = await this.prisma.mediaFolder.findFirst({
        where: { id: params.folderId, workspaceId: params.workspaceId },
        select: { id: true },
      });
      if (!folder) {
        throw new BadRequestException('Folder not found');
      }
    }

    const dir = this.ensureUploadDir(params.workspaceId);
    const ext = `.${detected.ext}`;
    const fileName = `${randomUUID()}${ext}`;
    const relativePath = join(params.workspaceId, fileName).replace(/\\/g, '/');
    const absolutePath = join(dir, fileName);

    /**
     * The bytes land on disk *before* the transaction opens, under a temporary
     * name in the destination directory (same filesystem, so the final `rename`
     * is atomic and cheap).
     *
     * Writing inside the transaction instead would hold both the advisory lock
     * and a Postgres connection for the duration of a disk write of up to
     * MAX_BYTES — blowing Prisma's 5s interactive-transaction timeout on large
     * uploads — and a rollback would leave the file behind, since the
     * filesystem does not participate in the transaction.
     */
    const tempPath = `${absolutePath}.part`;
    await writeFile(tempPath, params.buffer);

    let created: Awaited<ReturnType<typeof this.prisma.media.create>>;
    try {
      created = await this.prisma.$transaction(async (tx) => {
        await this.assertWithinStorageQuotaTx(
          tx,
          params.workspaceId,
          sizeBytes,
        );
        return tx.media.create({
          data: {
            workspaceId: params.workspaceId,
            fileName,
            originalName: params.originalName,
            // Store the sniffed, verified type — not the client-supplied header.
            mimeType: detected.mime,
            sizeBytes,
            relativePath,
            folderId: params.folderId ?? null,
          },
        });
      });
    } catch (err) {
      await this.discardTempFile(tempPath);
      throw err;
    }

    try {
      await rename(tempPath, absolutePath);
    } catch (err) {
      // The row is committed but its bytes never arrived — undo the row so the
      // quota total and the library never reference a file that is not there.
      await this.prisma.media
        .delete({ where: { id: created.id } })
        .catch(() => {
          /* best effort: the row is already orphaned, don't mask the real error */
        });
      await this.discardTempFile(tempPath);
      throw err;
    }

    return created;
  }

  private async discardTempFile(tempPath: string): Promise<void> {
    await unlink(tempPath).catch(() => {
      /* already gone, or never created */
    });
  }

  async list(query: ListMediaDto) {
    const where: Prisma.MediaWhereInput = {
      workspaceId: query.workspaceId,
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
    return buildPage(
      items.map((m) => this.toResponse(m)),
      total,
      query,
    );
  }

  /**
   * Aggregate counted in the database.
   *
   * `overview-metrics.tsx` used to download the whole media list and compute
   * `arr.length` and `arr.reduce((a, m) => a + m.sizeBytes, 0)` in the browser —
   * a full table scan over the wire to render two numbers.
   */
  async stats(workspaceId: string): Promise<{
    count: number;
    storageBytes: number;
  }> {
    const [count, aggregate] = await Promise.all([
      this.prisma.media.count({ where: { workspaceId } }),
      this.prisma.media.aggregate({
        where: { workspaceId },
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

    const srcAbs = join(this.uploadRoot, ...media.relativePath.split('/'));
    if (!existsSync(srcAbs)) {
      throw DomainException.badRequest(
        ErrorCode.MEDIA_FILE_MISSING,
        'Media file is missing on disk',
      );
    }

    const dir = this.ensureUploadDir(params.targetWorkspaceId);
    const ext = this.safeExt(media.originalName, media.mimeType);
    const fileName = `${randomUUID()}${ext}`;
    const relativePath = join(params.targetWorkspaceId, fileName).replace(
      /\\/g,
      '/',
    );
    const destAbs = join(dir, fileName);

    // Same temp-then-rename ordering as saveUploadedFile: the copy happens
    // outside the transaction, and only an atomic rename follows the commit.
    const tempPath = `${destAbs}.part`;
    await copyFile(srcAbs, tempPath);

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
      await this.discardTempFile(tempPath);
      throw err;
    }

    try {
      await rename(tempPath, destAbs);
    } catch (err) {
      await this.prisma.media
        .delete({ where: { id: created.id } })
        .catch(() => {
          /* best effort */
        });
      await this.discardTempFile(tempPath);
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

    const abs = join(this.uploadRoot, ...media.relativePath.split('/'));
    await this.prisma.media.delete({ where: { id } });
    if (existsSync(abs)) {
      try {
        unlinkSync(abs);
      } catch {
        // ignore
      }
    }
  }

  async listFolders(workspaceId: string) {
    return this.prisma.mediaFolder.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        name: true,
        createdAt: true,
        _count: { select: { medias: true } },
      },
    });
  }

  async createFolder(workspaceId: string, name: string) {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      throw new BadRequestException('Folder name is too short');
    }
    return this.prisma.mediaFolder.create({
      data: { workspaceId, name: trimmed },
      select: {
        id: true,
        name: true,
        createdAt: true,
        _count: { select: { medias: true } },
      },
    });
  }

  async renameFolder(workspaceId: string, folderId: string, name: string) {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      throw new BadRequestException('Folder name is too short');
    }
    const folder = await this.prisma.mediaFolder.findFirst({
      where: { id: folderId, workspaceId },
      select: { id: true },
    });
    if (!folder) throw new NotFoundException('Folder not found');
    return this.prisma.mediaFolder.update({
      where: { id: folderId },
      data: { name: trimmed },
      select: {
        id: true,
        name: true,
        createdAt: true,
        _count: { select: { medias: true } },
      },
    });
  }

  async deleteFolder(workspaceId: string, folderId: string) {
    const folder = await this.prisma.mediaFolder.findFirst({
      where: { id: folderId, workspaceId },
      select: { id: true },
    });
    if (!folder) throw new NotFoundException('Folder not found');
    await this.prisma.media.updateMany({
      where: { workspaceId, folderId },
      data: { folderId: null },
    });
    await this.prisma.mediaFolder.delete({ where: { id: folderId } });
  }

  async moveMediaToFolder(
    workspaceId: string,
    mediaId: string,
    folderId: string | null,
  ) {
    const media = await this.prisma.media.findFirst({
      where: { id: mediaId, workspaceId },
      select: { id: true },
    });
    if (!media) throw new NotFoundException('Media not found');
    if (folderId) {
      const folder = await this.prisma.mediaFolder.findFirst({
        where: { id: folderId, workspaceId },
        select: { id: true },
      });
      if (!folder) throw new NotFoundException('Folder not found');
    }
    const updated = await this.prisma.media.update({
      where: { id: mediaId },
      data: { folderId },
      include: { folder: true },
    });
    return this.toResponse(updated);
  }

  toResponse(media: {
    id: string;
    workspaceId: string;
    fileName: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    relativePath: string;
    folderId?: string | null;
    folder?: { id: string; name: string } | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: media.id,
      workspaceId: media.workspaceId,
      fileName: media.fileName,
      originalName: media.originalName,
      mimeType: media.mimeType,
      sizeBytes: media.sizeBytes,
      relativePath: media.relativePath,
      folderId: media.folderId ?? null,
      folderName: media.folder?.name ?? null,
      publicUrl: this.buildPublicUrl(media.relativePath),
      createdAt: media.createdAt.toISOString(),
      updatedAt: media.updatedAt.toISOString(),
    };
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
