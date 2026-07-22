import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { MediaService } from '../media/media.service';
import { CanvasesService } from '../canvases/canvases.service';
import type { Playlist, PlaylistItem, Media, Canvas } from '@prisma/client';

/**
 * Nested playlist resolution and payload building.
 *
 * Handles recursive flattening of nested playlists, circular reference
 * detection, and building screen-ready payload objects.
 * Extracted from PlaylistsService to reduce file size and improve cohesion.
 */
@Injectable()
export class PlaylistResolutionService {
  private static readonly MAX_NESTING_DEPTH = 5;

  constructor(
    private readonly prisma: PrismaService,
    private readonly mediaService: MediaService,
    private readonly canvasesService: CanvasesService,
  ) {}

  async assertNoCircularReference(
    nestedPlaylistId: string,
    targetPlaylistId: string,
    visited: Set<string>,
  ): Promise<void> {
    if (nestedPlaylistId === targetPlaylistId) {
      throw new Error(
        'Circular reference detected: nested playlist would create a loop.',
      );
    }

    if (visited.has(nestedPlaylistId)) {
      throw new Error(
        'Circular reference detected: nested playlist would create a loop.',
      );
    }

    visited.add(nestedPlaylistId);

    const items = await this.prisma.playlistItem.findMany({
      where: { playlistId: nestedPlaylistId, nestedPlaylistId: { not: null } },
      select: { nestedPlaylistId: true },
    });

    for (const item of items) {
      if (item.nestedPlaylistId) {
        await this.assertNoCircularReference(
          item.nestedPlaylistId,
          targetPlaylistId,
          new Set(visited),
        );
      }
    }
  }

  async resolvePlaylistItemsRecursive(
    playlist: Playlist & {
      items: (PlaylistItem & {
        media: Media | null;
        canvas: Canvas | null;
        nestedPlaylist: {
          id: string;
          name: string;
          isPublished: boolean;
        } | null;
      })[];
    },
    visited: Set<string>,
    depth: number,
  ): Promise<
    Array<{
      kind: 'media' | 'canvas';
      orderIndex: number;
      durationSec: number;
      zoneName: string | null;
      media?: ReturnType<MediaService['toResponse']>;
      canvas?: ReturnType<CanvasesService['toCompiledPayload']>;
    }>
  > {
    if (depth >= PlaylistResolutionService.MAX_NESTING_DEPTH) {
      return [];
    }

    const result: Array<{
      kind: 'media' | 'canvas';
      orderIndex: number;
      durationSec: number;
      zoneName: string | null;
      media?: ReturnType<MediaService['toResponse']>;
      canvas?: ReturnType<CanvasesService['toCompiledPayload']>;
    }> = [];

    const nestedIds = new Set<string>();
    for (const item of playlist.items) {
      if (
        item.nestedPlaylistId &&
        item.nestedPlaylist?.isPublished &&
        !visited.has(item.nestedPlaylistId)
      ) {
        nestedIds.add(item.nestedPlaylistId);
      }
    }

    let nestedPlaylistsMap = new Map<string, NonNullable<typeof playlist>>();
    if (nestedIds.size > 0) {
      const nestedPlaylists = await this.prisma.playlist.findMany({
        where: { id: { in: [...nestedIds] } },
        include: {
          items: {
            orderBy: { orderIndex: 'asc' },
            include: {
              media: true,
              canvas: true,
              nestedPlaylist: {
                select: { id: true, name: true, isPublished: true },
              },
            },
          },
        },
      });
      nestedPlaylistsMap = new Map(nestedPlaylists.map((p) => [p.id, p]));
    }

    for (const item of playlist.items) {
      if (item.mediaId && item.media) {
        result.push({
          kind: 'media',
          orderIndex: item.orderIndex,
          durationSec: item.durationSec,
          zoneName: item.zoneName ?? null,
          media: this.mediaService.toResponse(item.media),
        });
      } else if (item.canvasId && item.canvas) {
        result.push({
          kind: 'canvas',
          orderIndex: item.orderIndex,
          durationSec: item.durationSec,
          zoneName: item.zoneName ?? null,
          canvas: this.canvasesService.toCompiledPayload(item.canvas),
        });
      } else if (
        item.nestedPlaylistId &&
        item.nestedPlaylist &&
        item.nestedPlaylist.isPublished &&
        !visited.has(item.nestedPlaylistId)
      ) {
        const nestedPlaylist = nestedPlaylistsMap.get(item.nestedPlaylistId);

        if (nestedPlaylist) {
          const nestedVisited = new Set(visited);
          nestedVisited.add(item.nestedPlaylistId);
          const nestedItems = await this.resolvePlaylistItemsRecursive(
            nestedPlaylist,
            nestedVisited,
            depth + 1,
          );
          result.push(...nestedItems);
        }
      }
    }

    return result;
  }

  serializePlaylist(
    playlist: Playlist & {
      items: (PlaylistItem & {
        media: Media | null;
        canvas: Canvas | null;
        nestedPlaylist: {
          id: string;
          name: string;
          isPublished: boolean;
        } | null;
      })[];
    },
  ) {
    return {
      id: playlist.id,
      workspaceId: playlist.workspaceId ?? null,
      name: playlist.name,
      isPublished: playlist.isPublished,
      orientation: (playlist as any).orientation ?? 'AUTO',
      renderMode: (playlist as any).renderMode ?? 'CONTAIN',
      targetWidth: (playlist as any).targetWidth ?? null,
      targetHeight: (playlist as any).targetHeight ?? null,
      createdAt: playlist.createdAt.toISOString(),
      updatedAt: playlist.updatedAt.toISOString(),
      items: playlist.items.map((item) => this.serializeItem(item)),
    };
  }

  serializeItem(
    item: PlaylistItem & {
      media: Media | null;
      canvas: Canvas | null;
      nestedPlaylist: { id: string; name: string; isPublished: boolean } | null;
    },
  ) {
    const base = {
      id: item.id,
      orderIndex: item.orderIndex,
      durationSec: item.durationSec,
      zoneName: item.zoneName ?? null,
    };

    if (item.mediaId && item.media) {
      return {
        ...base,
        kind: 'media' as const,
        media: this.mediaService.toResponse(item.media),
      };
    }

    if (item.canvasId && item.canvas) {
      return {
        ...base,
        kind: 'canvas' as const,
        canvas: this.canvasesService.toCompiledPayload(item.canvas),
      };
    }

    if (item.nestedPlaylistId && item.nestedPlaylist) {
      return {
        ...base,
        kind: 'playlist' as const,
        playlist: {
          id: item.nestedPlaylist.id,
          name: item.nestedPlaylist.name,
          isPublished: item.nestedPlaylist.isPublished,
        },
      };
    }

    return {
      ...base,
      kind: 'unknown' as const,
    };
  }

  async buildRotationPayload(
    screen: { workspaceId: string; id: string },
    screenId: string,
  ) {
    const assignments = await this.prisma.screenPlaylistAssignment.findMany({
      where: { screenId },
      orderBy: { orderIndex: 'asc' },
      include: {
        playlist: {
          include: {
            items: {
              orderBy: { orderIndex: 'asc' },
              include: {
                media: true,
                canvas: true,
                nestedPlaylist: {
                  select: { id: true, name: true, isPublished: true },
                },
              },
            },
          },
        },
      },
    });

    const published = assignments.filter(
      (a) => a.playlist.isPublished && a.playlist.items.length > 0,
    );

    if (published.length === 0) {
      return {
        workspaceId: screen.workspaceId,
        screenId,
        playlistId: null,
        name: null,
        isPublished: false,
        activeSource: 'rotation' as const,
        items: [],
      };
    }

    let globalOrder = 0;
    const mergedItems: Array<{
      kind: 'media' | 'canvas';
      orderIndex: number;
      durationSec: number;
      zoneName?: string | null;
      media?: ReturnType<MediaService['toResponse']>;
      canvas?: ReturnType<CanvasesService['toCompiledPayload']>;
    }> = [];

    for (const assignment of published) {
      const resolved = await this.resolvePlaylistItemsRecursive(
        assignment.playlist,
        new Set([assignment.playlist.id]),
        0,
      );
      for (const item of resolved) {
        if (item.kind === 'media') {
          mergedItems.push({
            kind: 'media' as const,
            orderIndex: globalOrder++,
            durationSec: item.durationSec,
            zoneName: item.zoneName ?? null,
            media: item.media!,
          });
        } else if (item.kind === 'canvas') {
          mergedItems.push({
            kind: 'canvas' as const,
            orderIndex: globalOrder++,
            durationSec: item.durationSec,
            zoneName: item.zoneName ?? null,
            canvas: item.canvas!,
          });
        }
      }
    }

    return {
      workspaceId: screen.workspaceId,
      screenId,
      playlistId: published[0].playlist.id,
      name: published.map((a) => a.playlist.name).join(' → '),
      isPublished: true,
      activeSource: 'rotation' as const,
      items: mergedItems,
    };
  }

  async buildPayload(
    workspaceId: string,
    screenId: string | null,
    playlist: Playlist & {
      items: (PlaylistItem & {
        media: Media | null;
        canvas: Canvas | null;
        nestedPlaylist: {
          id: string;
          name: string;
          isPublished: boolean;
        } | null;
      })[];
    },
    activeSource: 'override' | 'schedule' | 'rotation' | 'default' = 'default',
  ) {
    const resolvedItems = await this.resolvePlaylistItemsRecursive(
      playlist,
      new Set([playlist.id]),
      0,
    );

    return {
      workspaceId,
      screenId,
      playlistId: playlist.id,
      name: playlist.name,
      isPublished: playlist.isPublished,
      activeSource,
      renderMode: (playlist as any).renderMode ?? 'CONTAIN',
      orientation: (playlist as any).orientation ?? 'AUTO',
      targetWidth: (playlist as any).targetWidth ?? null,
      targetHeight: (playlist as any).targetHeight ?? null,
      items: resolvedItems.map((item) => {
        if (item.kind === 'media') {
          return {
            kind: 'media' as const,
            orderIndex: item.orderIndex,
            durationSec: item.durationSec,
            zoneName: item.zoneName ?? null,
            media: item.media!,
          };
        }
        return {
          kind: 'canvas' as const,
          orderIndex: item.orderIndex,
          durationSec: item.durationSec,
          zoneName: item.zoneName ?? null,
          canvas: item.canvas!,
        };
      }),
    };
  }
}
