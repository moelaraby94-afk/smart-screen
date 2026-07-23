import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { STORAGE_SERVICE } from '../../common/storage/storage.interface';
import type { IStorageService } from '../../common/storage/storage.interface';
import { toMediaResponse, type MediaResponse } from './media.mapper';

/**
 * Media folder organization: list, create, rename, delete, move media.
 * Extracted from MediaService to reduce file size and improve cohesion.
 */
@Injectable()
export class MediaFoldersService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(STORAGE_SERVICE) private readonly storage: IStorageService,
  ) {}

  async listFolders(ownerId: string, workspaceId?: string) {
    const where: { ownerId: string; workspaceId?: string } = { ownerId };
    if (workspaceId) where.workspaceId = workspaceId;
    return this.prisma.mediaFolder.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        name: true,
        createdAt: true,
        _count: { select: { medias: true } },
      },
    });
  }

  async createFolder(
    ownerId: string,
    workspaceId: string | null,
    name: string,
  ) {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      throw new BadRequestException('Folder name is too short');
    }
    return this.prisma.mediaFolder.create({
      data: { ownerId, workspaceId: workspaceId ?? undefined, name: trimmed },
      select: {
        id: true,
        name: true,
        createdAt: true,
        _count: { select: { medias: true } },
      },
    });
  }

  async renameFolder(
    ownerId: string,
    workspaceId: string | null,
    folderId: string,
    name: string,
  ) {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      throw new BadRequestException('Folder name is too short');
    }
    const where: { id: string; ownerId: string; workspaceId?: string } = {
      id: folderId,
      ownerId,
    };
    if (workspaceId) where.workspaceId = workspaceId;
    const folder = await this.prisma.mediaFolder.findFirst({
      where,
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

  async deleteFolder(
    ownerId: string,
    workspaceId: string | null,
    folderId: string,
  ) {
    const where: { id: string; ownerId: string; workspaceId?: string } = {
      id: folderId,
      ownerId,
    };
    if (workspaceId) where.workspaceId = workspaceId;
    const folder = await this.prisma.mediaFolder.findFirst({
      where,
      select: { id: true, isDefault: true },
    });
    if (!folder) throw new NotFoundException('Folder not found');
    if (folder.isDefault) {
      throw new BadRequestException('Cannot delete the default folder');
    }
    const mediaWhere: {
      folderId: string;
      ownerId: string;
      workspaceId?: string;
    } = { folderId, ownerId };
    if (workspaceId) mediaWhere.workspaceId = workspaceId;
    await this.prisma.media.updateMany({
      where: mediaWhere,
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
    workspaceId: string | null;
    fileName: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    width?: number | null;
    height?: number | null;
    durationSec?: number | null;
    rotation?: number | null;
    codec?: string | null;
    bitrate?: number | null;
    frameRate?: number | null;
    relativePath: string;
    folderId?: string | null;
    folder?: { id: string; name: string } | null;
    createdAt: Date;
    updatedAt: Date;
    expiresAt?: Date | null;
  }): MediaResponse {
    return toMediaResponse(media, this.storage);
  }
}
