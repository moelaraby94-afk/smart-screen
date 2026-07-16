'use client';

import {
  Ellipse,
  Group,
  Image as KonvaImage,
  Layer,
  Line as KonvaLine,
  Rect,
  Stage,
  Text,
} from 'react-konva';
import useImage from 'use-image';
import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import type { CanvasLayoutV1, CanvasObjectJson } from '@/features/studio/canvas-layout';

const SNAP_THRESHOLD = 6;

type GuideLine = { points: number[]; orientation: 'h' | 'v' };

function computeSnapGuides(
  draggedId: string,
  dragX: number,
  dragY: number,
  obj: CanvasObjectJson,
  others: CanvasObjectJson[],
  canvasW: number,
  canvasH: number,
): { snappedX: number; snappedY: number; guides: GuideLine[] } {
  const w = obj.width ?? 120;
  const h = obj.height ?? 80;
  const guides: GuideLine[] = [];
  let snappedX = dragX;
  let snappedY = dragY;

  const dragEdges = {
    left: dragX,
    right: dragX + w,
    centerX: dragX + w / 2,
    top: dragY,
    bottom: dragY + h,
    centerY: dragY + h / 2,
  };

  const snapTargets: Array<{ value: number; axis: 'x' | 'y'; edge: string }> = [
    { value: 0, axis: 'x', edge: 'left' },
    { value: canvasW / 2, axis: 'x', edge: 'centerX' },
    { value: canvasW, axis: 'x', edge: 'right' },
    { value: 0, axis: 'y', edge: 'top' },
    { value: canvasH / 2, axis: 'y', edge: 'centerY' },
    { value: canvasH, axis: 'y', edge: 'bottom' },
  ];

  for (const other of others) {
    if (other.id === draggedId) continue;
    const ow = other.width ?? 120;
    const oh = other.height ?? 80;
    snapTargets.push(
      { value: other.x, axis: 'x', edge: 'left' },
      { value: other.x + ow / 2, axis: 'x', edge: 'centerX' },
      { value: other.x + ow, axis: 'x', edge: 'right' },
      { value: other.y, axis: 'y', edge: 'top' },
      { value: other.y + oh / 2, axis: 'y', edge: 'centerY' },
      { value: other.y + oh, axis: 'y', edge: 'bottom' },
    );
  }

  for (const target of snapTargets) {
    if (target.axis === 'x') {
      const dragVal = dragEdges[target.edge as keyof typeof dragEdges];
      if (Math.abs(dragVal - target.value) <= SNAP_THRESHOLD) {
        const offset = target.value - dragVal;
        snappedX = dragX + offset;
        guides.push({ points: [target.value, 0, target.value, canvasH], orientation: 'v' });
      }
    } else {
      const dragVal = dragEdges[target.edge as keyof typeof dragEdges];
      if (Math.abs(dragVal - target.value) <= SNAP_THRESHOLD) {
        const offset = target.value - dragVal;
        snappedY = dragY + offset;
        guides.push({ points: [0, target.value, canvasW, target.value], orientation: 'h' });
      }
    }
  }

  return { snappedX, snappedY, guides };
}

export function QrCodeShape({
  obj,
  onSelect,
  onMove,
}: {
  obj: CanvasObjectJson;
  onSelect: () => void;
  onMove: (id: string, x: number, y: number) => void;
}) {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [img] = useImage(dataUrl, 'anonymous');

  useEffect(() => {
    const data = obj.qrData || 'https://cloudscreen.app';
    QRCode.toDataURL(data, { width: 256, margin: 1 })
      .then(setDataUrl)
      .catch(() => {});
  }, [obj.qrData]);

  if (!img || !obj.width || !obj.height) return null;
  return (
    <KonvaImage
      id={obj.id}
      name={obj.id}
      image={img}
      x={obj.x}
      y={obj.y}
      width={obj.width}
      height={obj.height}
      rotation={obj.rotation ?? 0}
      opacity={obj.opacity ?? 1}
      draggable={!obj.locked}
      onClick={(e) => {
        e.cancelBubble = true;
        onSelect();
      }}
      onTap={(e) => {
        e.cancelBubble = true;
        onSelect();
      }}
      onDragEnd={(e) => {
        const n = e.target;
        onMove(obj.id, n.x(), n.y());
      }}
    />
  );
}

export function ImageShape({
  obj,
  onSelect,
  onMove,
}: {
  obj: CanvasObjectJson;
  onSelect: () => void;
  onMove: (id: string, x: number, y: number) => void;
}) {
  const [img] = useImage(obj.imageUrl ?? '', 'anonymous');
  if (!img || !obj.width || !obj.height) return null;

  const fitMode = obj.fitMode ?? 'contain';
  const imgRatio = img.width / img.height;
  const boxRatio = obj.width / obj.height;
  let drawW = obj.width;
  let drawH = obj.height;
  let offsetX = 0;
  let offsetY = 0;

  if (fitMode === 'contain') {
    if (imgRatio > boxRatio) {
      drawW = obj.width;
      drawH = obj.width / imgRatio;
      offsetY = (obj.height - drawH) / 2;
    } else {
      drawH = obj.height;
      drawW = obj.height * imgRatio;
      offsetX = (obj.width - drawW) / 2;
    }
  } else if (fitMode === 'cover') {
    if (imgRatio > boxRatio) {
      drawH = obj.height;
      drawW = obj.height * imgRatio;
      offsetX = (obj.width - drawW) / 2;
    } else {
      drawW = obj.width;
      drawH = obj.width / imgRatio;
      offsetY = (obj.height - drawH) / 2;
    }
  }

  return (
    <KonvaImage
      id={obj.id}
      name={obj.id}
      image={img}
      x={obj.x + offsetX}
      y={obj.y + offsetY}
      width={drawW}
      height={drawH}
      rotation={obj.rotation ?? 0}
      opacity={obj.opacity ?? 1}
      draggable={!obj.locked}
      onClick={(e) => {
        e.cancelBubble = true;
        onSelect();
      }}
      onTap={(e) => {
        e.cancelBubble = true;
        onSelect();
      }}
      onDragEnd={(e) => {
        const n = e.target;
        onMove(obj.id, n.x() - offsetX, n.y() - offsetY);
      }}
    />
  );
}

type CanvasRendererProps = {
  objects: CanvasObjectJson[];
  onSelect: (id: string) => void;
  onUpdateObject: (id: string, patch: Partial<CanvasObjectJson>) => void;
  canvasW: number;
  canvasH: number;
  onGuidesChange: (guides: GuideLine[]) => void;
};

export function CanvasObjectsRenderer({ objects, onSelect, onUpdateObject, canvasW, canvasH, onGuidesChange }: CanvasRendererProps) {
  return (
    <>
      {objects.map((obj) => {
        const common = {
          id: obj.id,
          name: obj.id,
          rotation: obj.rotation ?? 0,
          opacity: obj.opacity ?? 1,
          draggable: !(obj.locked ?? false),
          onClick: (e: { cancelBubble: boolean }) => {
            e.cancelBubble = true;
            onSelect(obj.id);
          },
          onDragMove: (e: {
            target: { x: (val?: number) => number; y: (val?: number) => number };
          }) => {
            const n = e.target;
            const { snappedX, snappedY, guides } = computeSnapGuides(
              obj.id,
              n.x(),
              n.y(),
              obj,
              objects,
              canvasW,
              canvasH,
            );
            if (snappedX !== n.x()) n.x(snappedX);
            if (snappedY !== n.y()) n.y(snappedY);
            onGuidesChange(guides);
          },
          onDragEnd: (e: {
            target: { x: () => number; y: () => number; getLayer: () => unknown };
          }) => {
            const n = e.target;
            onUpdateObject(obj.id, { x: n.x(), y: n.y() });
            onGuidesChange([]);
            n.getLayer();
          },
        };

        if (obj.type === 'rect') {
          return (
            <Rect
              key={obj.id}
              x={obj.x}
              y={obj.y}
              width={obj.width ?? 120}
              height={obj.height ?? 80}
              fill={obj.fill ?? 'hsl(var(--primary))'}
              stroke={obj.stroke}
              strokeWidth={obj.strokeWidth ?? 0}
              cornerRadius={obj.cornerRadius ?? 0}
              {...common}
            />
          );
        }
        if (obj.type === 'ellipse') {
          const rw = (obj.width ?? 120) / 2;
          const rh = (obj.height ?? 80) / 2;
          return (
            <Ellipse
              key={obj.id}
              id={obj.id}
              name={obj.id}
              x={obj.x + rw}
              y={obj.y + rh}
              radiusX={rw}
              radiusY={rh}
              fill={obj.fill ?? 'hsl(var(--primary))'}
              stroke={obj.stroke}
              strokeWidth={obj.strokeWidth ?? 0}
              rotation={obj.rotation ?? 0}
              opacity={obj.opacity ?? 1}
              draggable
              onClick={(e) => {
                e.cancelBubble = true;
                onSelect(obj.id);
              }}
              onDragEnd={(e) => {
                const n = e.target;
                onUpdateObject(obj.id, { x: n.x() - rw, y: n.y() - rh });
              }}
            />
          );
        }
        if (obj.type === 'text') {
          return (
            <Text
              key={obj.id}
              x={obj.x}
              y={obj.y}
              text={obj.text ?? ''}
              fontSize={obj.fontSize ?? 48}
              fontFamily={
                obj.fontFamily ??
                '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif'
              }
              fontStyle={obj.fontStyle ?? 'normal'}
              align={obj.align ?? 'left'}
              verticalAlign={obj.verticalAlign ?? 'top'}
              fill={obj.fill ?? 'hsl(var(--primary))'}
              width={obj.width}
              height={obj.height}
              {...common}
            />
          );
        }
        if (obj.type === 'image') {
          return (
            <ImageShape
              key={obj.id}
              obj={obj}
              onSelect={() => onSelect(obj.id)}
              onMove={(id, x, y) => onUpdateObject(id, { x, y })}
            />
          );
        }
        if (obj.type === 'zone') {
          return (
            <Rect
              key={obj.id}
              x={obj.x}
              y={obj.y}
              width={obj.width ?? 400}
              height={obj.height ?? 300}
              fill={obj.fill ?? 'rgba(99, 102, 241, 0.08)'}
              stroke={obj.stroke ?? 'rgba(99, 102, 241, 0.6)'}
              strokeWidth={obj.strokeWidth ?? 2}
              dash={[8, 4]}
              cornerRadius={4}
              {...common}
            />
          );
        }
        if (obj.type === 'line') {
          return (
            <KonvaLine
              key={obj.id}
              x={obj.x}
              y={obj.y}
              points={obj.points ?? [0, 0, obj.width ?? 200, 0]}
              stroke={obj.stroke ?? obj.fill ?? 'hsl(var(--primary))'}
              strokeWidth={obj.strokeWidth ?? 4}
              lineCap="round"
              {...common}
            />
          );
        }
        if (obj.type === 'arrow') {
          return (
            <KonvaLine
              key={obj.id}
              x={obj.x}
              y={obj.y}
              points={obj.points ?? [0, 0, obj.width ?? 200, 0]}
              stroke={obj.stroke ?? obj.fill ?? 'hsl(var(--primary))'}
              strokeWidth={obj.strokeWidth ?? 4}
              lineCap="round"
              pointerAtEnd
              pointerLength={12}
              pointerWidth={12}
              {...common}
            />
          );
        }
        if (obj.type === 'qrcode') {
          return (
            <QrCodeShape
              key={obj.id}
              obj={obj}
              onSelect={() => onSelect(obj.id)}
              onMove={(id, x, y) => onUpdateObject(id, { x, y })}
            />
          );
        }
        return null;
      })}
    </>
  );
}

type CanvasStageProps = {
  size: { w: number; h: number };
  ox: number;
  oy: number;
  scale: number;
  dw: number;
  dh: number;
  layout: CanvasLayoutV1;
  onSelect: (id: string) => void;
  onUpdateObject: (id: string, patch: Partial<CanvasObjectJson>) => void;
  onStageClick: () => void;
  onDrop: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  dropHint: string;
};

export function CanvasStageView(props: CanvasStageProps) {
  const [guides, setGuides] = useState<GuideLine[]>([]);
  return (
    <div
      ref={props.containerRef}
      className="h-[min(62vh,640px)] w-full"
      onDrop={props.onDrop}
      onDragOver={props.onDragOver}
    >
      <Stage
        width={props.size.w}
        height={props.size.h}
        onMouseDown={(e) => {
          if (e.target === e.target.getStage()) props.onStageClick();
        }}
      >
        <Layer>
          <Rect x={0} y={0} width={props.size.w} height={props.size.h} fill="transparent" />
          <Group x={props.ox} y={props.oy} scaleX={props.scale} scaleY={props.scale}>
            <Rect x={0} y={0} width={props.dw} height={props.dh} fill="hsl(var(--background))" stroke="hsl(var(--primary))" strokeWidth={2} />
            <CanvasObjectsRenderer
              objects={props.layout.objects}
              onSelect={props.onSelect}
              onUpdateObject={props.onUpdateObject}
              canvasW={props.dw}
              canvasH={props.dh}
              onGuidesChange={setGuides}
            />
            {guides.map((g, i) => (
              <KonvaLine
                key={i}
                points={g.points}
                stroke="hsl(var(--primary))"
                strokeWidth={1}
                dash={[4, 4]}
                listening={false}
              />
            ))}
          </Group>
        </Layer>
      </Stage>
    </div>
  );
}
