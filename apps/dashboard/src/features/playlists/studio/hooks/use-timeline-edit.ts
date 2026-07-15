'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { DropResult } from '@hello-pangea/dnd';
import { saveItemTransition, itemTransitionKey, type TransitionType, type PlaylistLocalMeta } from '@/features/playlists/playlist-transitions';
import type { Row } from '../types';

type UseTimelineEditParams = {
  rows: Row[];
  setRows: React.Dispatch<React.SetStateAction<Row[]>>;
  playlistMeta: PlaylistLocalMeta;
  selectedZoneId: string | null;
  playlistId: string;
  library: Row['kind'] extends 'media' ? Array<{ id: string }> : never;
  skipHistoryRef: React.MutableRefObject<boolean>;
};

// We need library and canvasLibrary to look up items on drag from library
type FullParams = UseTimelineEditParams & {
  mediaLibrary: Array<{ id: string; originalName: string; mimeType: string; publicUrl: string }>;
  canvasLibrary: Array<{ id: string; name: string }>;
};

type UseTimelineEditReturn = {
  undoStack: Row[][];
  redoStack: Row[][];
  undo: () => void;
  redo: () => void;
  onDragEnd: (result: DropResult) => void;
  updateDuration: (clientId: string, value: number) => void;
  removeRow: (clientId: string) => void;
  moveRow: (index: number, delta: -1 | 1) => void;
  duplicateRow: (clientId: string) => void;
  updateRowTransition: (clientId: string, transition: TransitionType) => void;
};

export function useTimelineEdit({
  rows,
  setRows,
  playlistMeta,
  selectedZoneId,
  playlistId,
  mediaLibrary,
  canvasLibrary,
  skipHistoryRef,
}: FullParams): UseTimelineEditReturn {
  const [undoStack, setUndoStack] = useState<Row[][]>([]);
  const [redoStack, setRedoStack] = useState<Row[][]>([]);

  const pushHistory = useCallback((prev: Row[]) => {
    if (skipHistoryRef.current) {
      skipHistoryRef.current = false;
      return;
    }
    setUndoStack((s) => [...s.slice(-49), prev]);
    setRedoStack([]);
  }, [skipHistoryRef]);

  const undo = useCallback(() => {
    setUndoStack((prevStack) => {
      if (prevStack.length === 0) return prevStack;
      const prev = prevStack[prevStack.length - 1];
      setRows((current) => {
        setRedoStack((r) => [...r, current]);
        return prev;
      });
      return prevStack.slice(0, -1);
    });
  }, [setRows]);

  const redo = useCallback(() => {
    setRedoStack((prevStack) => {
      if (prevStack.length === 0) return prevStack;
      const next = prevStack[prevStack.length - 1];
      setRows((current) => {
        setUndoStack((u) => [...u, current]);
        return next;
      });
      return prevStack.slice(0, -1);
    });
  }, [setRows]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo]);

  const onDragEnd = useCallback(
    (result: DropResult) => {
      const { destination, source, draggableId } = result;
      if (!destination) return;

      const currentZone = playlistMeta.layoutType === 'single' ? 'full' : (selectedZoneId ?? '__default__');

      const zoneRowClientIds = playlistMeta.layoutType === 'single'
        ? rows.map((r) => r.clientId)
        : rows.filter((r) => (r.zoneName ?? '__default__') === currentZone).map((r) => r.clientId);

      if (source.droppableId === 'library' && destination.droppableId === 'playlist') {
        const mediaId = draggableId.replace('lib-', '');
        const media = mediaLibrary.find((m) => m.id === mediaId);
        if (!media) return;

        let globalIndex: number;
        if (playlistMeta.layoutType === 'single' || zoneRowClientIds.length === 0) {
          globalIndex = destination.index;
        } else {
          if (destination.index >= zoneRowClientIds.length) {
            const lastZoneClientId = zoneRowClientIds[zoneRowClientIds.length - 1]!;
            globalIndex = rows.findIndex((r) => r.clientId === lastZoneClientId) + 1;
          } else {
            const targetClientId = zoneRowClientIds[destination.index]!;
            globalIndex = rows.findIndex((r) => r.clientId === targetClientId);
          }
        }

        const next = Array.from(rows);
        next.splice(globalIndex, 0, {
          clientId: crypto.randomUUID(),
          kind: 'media',
          mediaId: media.id,
          durationSec: 10,
          media: media as any,
          zoneName: playlistMeta.layoutType === 'single' ? null : currentZone,
        });
        pushHistory(rows);
        setRows(next);
        return;
      }

      if (source.droppableId === 'canvas-library' && destination.droppableId === 'playlist') {
        const canvasId = draggableId.replace('cvs-', '');
        const canvas = canvasLibrary.find((c) => c.id === canvasId);
        if (!canvas) return;

        let globalIndex: number;
        if (playlistMeta.layoutType === 'single' || zoneRowClientIds.length === 0) {
          globalIndex = destination.index;
        } else {
          if (destination.index >= zoneRowClientIds.length) {
            const lastZoneClientId = zoneRowClientIds[zoneRowClientIds.length - 1]!;
            globalIndex = rows.findIndex((r) => r.clientId === lastZoneClientId) + 1;
          } else {
            const targetClientId = zoneRowClientIds[destination.index]!;
            globalIndex = rows.findIndex((r) => r.clientId === targetClientId);
          }
        }

        const next = Array.from(rows);
        next.splice(globalIndex, 0, {
          clientId: crypto.randomUUID(),
          kind: 'canvas',
          canvasId: canvas.id,
          durationSec: 15,
          canvas: { id: canvas.id, name: canvas.name },
          zoneName: playlistMeta.layoutType === 'single' ? null : currentZone,
        });
        pushHistory(rows);
        setRows(next);
        return;
      }

      if (source.droppableId === 'playlist' && destination.droppableId === 'playlist') {
        if (playlistMeta.layoutType === 'single') {
          const next = Array.from(rows);
          const [removed] = next.splice(source.index, 1);
          if (!removed) return;
          next.splice(destination.index, 0, removed);
          pushHistory(rows);
          setRows(next);
        } else {
          const fromClientId = zoneRowClientIds[source.index];
          const toClientId = zoneRowClientIds[destination.index];
          if (!fromClientId || !toClientId) return;
          const fromGlobal = rows.findIndex((r) => r.clientId === fromClientId);
          const toGlobal = rows.findIndex((r) => r.clientId === toClientId);
          if (fromGlobal === -1 || toGlobal === -1) return;
          const next = Array.from(rows);
          const [removed] = next.splice(fromGlobal, 1);
          if (!removed) return;
          next.splice(toGlobal, 0, removed);
          pushHistory(rows);
          setRows(next);
        }
      }
    },
    [rows, setRows, playlistMeta, selectedZoneId, mediaLibrary, canvasLibrary, pushHistory],
  );

  const updateDuration = useCallback(
    (clientId: string, value: number) => {
      setRows((prev) => {
        pushHistory(prev);
        return prev.map((r) =>
          r.clientId === clientId ? { ...r, durationSec: Math.max(1, value) } : r,
        );
      });
    },
    [setRows, pushHistory],
  );

  const removeRow = useCallback(
    (clientId: string) => {
      setRows((prev) => {
        pushHistory(prev);
        return prev.filter((r) => r.clientId !== clientId);
      });
    },
    [setRows, pushHistory],
  );

  const moveRow = useCallback(
    (index: number, delta: -1 | 1) => {
      setRows((prev) => {
        const currentZone = playlistMeta.layoutType === 'single' ? 'full' : (selectedZoneId ?? '__default__');
        const zoneRows = playlistMeta.layoutType === 'single'
          ? prev
          : prev.filter((r) => (r.zoneName ?? '__default__') === currentZone);

        const fromRow = zoneRows[index];
        const toRow = zoneRows[index + delta];
        if (!fromRow || !toRow) return prev;

        const fromGlobal = prev.findIndex((r) => r.clientId === fromRow.clientId);
        const toGlobal = prev.findIndex((r) => r.clientId === toRow.clientId);
        if (fromGlobal === -1 || toGlobal === -1) return prev;

        const next = [...prev];
        const tmp = next[fromGlobal];
        next[fromGlobal] = next[toGlobal]!;
        next[toGlobal] = tmp!;
        pushHistory(prev);
        return next;
      });
    },
    [setRows, playlistMeta, selectedZoneId, pushHistory],
  );

  const duplicateRow = useCallback(
    (clientId: string) => {
      setRows((prev) => {
        const idx = prev.findIndex((r) => r.clientId === clientId);
        if (idx === -1) return prev;
        const orig = prev[idx]!;
        const clone: Row = {
          ...orig,
          clientId: crypto.randomUUID(),
        };
        pushHistory(prev);
        const next = [...prev];
        next.splice(idx + 1, 0, clone);
        return next;
      });
    },
    [setRows, pushHistory],
  );

  const updateRowTransition = useCallback(
    (clientId: string, transition: TransitionType) => {
      setRows((prev) => {
        const idx = prev.findIndex((r) => r.clientId === clientId);
        if (idx === -1) return prev;
        const row = prev[idx]!;
        const trKey = itemTransitionKey(row.kind, row.kind === 'media' ? row.mediaId : undefined, row.kind === 'canvas' ? row.canvasId : undefined, idx);
        if (playlistId) saveItemTransition(playlistId, trKey, transition);
        return prev.map((r) =>
          r.clientId === clientId ? { ...r, transition } : r,
        );
      });
    },
    [setRows, playlistId],
  );

  return {
    undoStack,
    redoStack,
    undo,
    redo,
    onDragEnd,
    updateDuration,
    removeRow,
    moveRow,
    duplicateRow,
    updateRowTransition,
  };
}
