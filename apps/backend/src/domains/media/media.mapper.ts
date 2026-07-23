import type { IStorageService } from '../../common/storage/storage.interface';

/**
 * Shared media response shape — single source of truth for all media API responses.
 * Used by MediaService and MediaFoldersService to avoid duplicate toResponse implementations.
 */
export type MediaResponse = {
  id: string;
  workspaceId: string | null;
  fileName: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  durationSec: number | null;
  rotation: number | null;
  codec: string | null;
  bitrate: number | null;
  frameRate: number | null;
  relativePath: string;
  folderId: string | null;
  folderName: string | null;
  publicUrl: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
};

/**
 * Input shape — covers both Prisma Media model and partial selects.
 */
export type MediaResponseInput = {
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
};

/**
 * Maps a Media entity (or partial select) to a consistent API response shape.
 * Pure function — no service dependencies, just needs a storage instance for URL building.
 */
export function toMediaResponse(
  media: MediaResponseInput,
  storage: IStorageService,
): MediaResponse {
  return {
    id: media.id,
    workspaceId: media.workspaceId,
    fileName: media.fileName,
    originalName: media.originalName,
    mimeType: media.mimeType,
    sizeBytes: media.sizeBytes,
    width: media.width ?? null,
    height: media.height ?? null,
    durationSec: media.durationSec ?? null,
    rotation: media.rotation ?? null,
    codec: media.codec ?? null,
    bitrate: media.bitrate ?? null,
    frameRate: media.frameRate ?? null,
    relativePath: media.relativePath,
    folderId: media.folderId ?? null,
    folderName: media.folder?.name ?? null,
    publicUrl: storage.getPublicUrl(media.relativePath),
    createdAt: media.createdAt.toISOString(),
    updatedAt: media.updatedAt.toISOString(),
    expiresAt: media.expiresAt ? media.expiresAt.toISOString() : null,
  };
}
