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
  Transformer,
} from 'react-konva';
import useImage from 'use-image';
import { useEffect, useRef, useState } from 'react';
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

type ExtendedShapeProps = {
  obj: CanvasObjectJson;
  objects: CanvasObjectJson[];
  canvasW: number;
  canvasH: number;
  onSelect: () => void;
  onMove: (id: string, x: number, y: number) => void;
  onUpdateObject: (id: string, patch: Partial<CanvasObjectJson>) => void;
  onGuidesChange: (guides: GuideLine[]) => void;
};

export function QrCodeShape({
  obj,
  objects,
  canvasW,
  canvasH,
  onSelect,
  onMove,
  onUpdateObject,
  onGuidesChange,
}: ExtendedShapeProps) {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [img] = useImage(dataUrl, 'anonymous');

  useEffect(() => {
    const data = obj.qrData || 'https://smartscreen.app';
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
      onDragMove={(e) => {
        const n = e.target;
        const { snappedX, snappedY, guides } = computeSnapGuides(
          obj.id, n.x(), n.y(), obj, objects, canvasW, canvasH,
        );
        if (snappedX !== n.x()) n.x(snappedX);
        if (snappedY !== n.y()) n.y(snappedY);
        onGuidesChange(guides);
      }}
      onDragEnd={(e) => {
        const n = e.target;
        onMove(obj.id, n.x(), n.y());
        onGuidesChange([]);
      }}
      onTransformEnd={(e) => {
        const n = e.target;
        const sx = n.scaleX();
        const sy = n.scaleY();
        const updates: Partial<CanvasObjectJson> = {
          x: n.x(), y: n.y(), rotation: n.rotation(),
        };
        if (sx !== 1 || sy !== 1) {
          updates.width = (obj.width ?? n.width()) * sx;
          updates.height = (obj.height ?? n.height()) * sy;
          updates.scaleX = 1;
          updates.scaleY = 1;
          n.scaleX(1);
          n.scaleY(1);
        }
        onUpdateObject(obj.id, updates);
      }}
    />
  );
}

export function ImageShape({
  obj,
  objects,
  canvasW,
  canvasH,
  onSelect,
  onMove,
  onUpdateObject,
  onGuidesChange,
}: ExtendedShapeProps) {
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
      onDragMove={(e) => {
        const n = e.target;
        const { snappedX, snappedY, guides } = computeSnapGuides(
          obj.id, n.x() - offsetX, n.y() - offsetY, obj, objects, canvasW, canvasH,
        );
        if (snappedX !== n.x() - offsetX) n.x(snappedX + offsetX);
        if (snappedY !== n.y() - offsetY) n.y(snappedY + offsetY);
        onGuidesChange(guides);
      }}
      onDragEnd={(e) => {
        const n = e.target;
        onMove(obj.id, n.x() - offsetX, n.y() - offsetY);
        onGuidesChange([]);
      }}
      onTransformEnd={(e) => {
        const n = e.target;
        const sx = n.scaleX();
        const sy = n.scaleY();
        const updates: Partial<CanvasObjectJson> = {
          x: n.x() - offsetX, y: n.y() - offsetY, rotation: n.rotation(),
        };
        if (sx !== 1 || sy !== 1) {
          updates.width = (obj.width ?? n.width()) * sx;
          updates.height = (obj.height ?? n.height()) * sy;
          updates.scaleX = 1;
          updates.scaleY = 1;
          n.scaleX(1);
          n.scaleY(1);
        }
        onUpdateObject(obj.id, updates);
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
  onTextDblClick?: (id: string) => void;
};

export function CanvasObjectsRenderer({ objects, onSelect, onUpdateObject, canvasW, canvasH, onGuidesChange, onTextDblClick }: CanvasRendererProps) {
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
          onTransformEnd: (e: {
            target: {
              x: (val?: number) => number;
              y: (val?: number) => number;
              rotation: (val?: number) => number;
              scaleX: (val?: number) => number;
              scaleY: (val?: number) => number;
              width: (val?: number) => number;
              height: (val?: number) => number;
            };
          }) => {
            const n = e.target;
            const sx = n.scaleX();
            const sy = n.scaleY();
            const updates: Partial<CanvasObjectJson> = {
              x: n.x(),
              y: n.y(),
              rotation: n.rotation(),
            };
            if (sx !== 1 || sy !== 1) {
              if (obj.type === 'text') {
                updates.fontSize = Math.round((obj.fontSize ?? 48) * Math.min(sx, sy));
              } else {
                updates.width = (obj.width ?? n.width()) * sx;
                updates.height = (obj.height ?? n.height()) * sy;
              }
              updates.scaleX = 1;
              updates.scaleY = 1;
              n.scaleX(1);
              n.scaleY(1);
            }
            onUpdateObject(obj.id, updates);
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
            <Group key={obj.id} x={obj.x} y={obj.y} {...common}>
              <Ellipse
                x={rw}
                y={rh}
                radiusX={rw}
                radiusY={rh}
                fill={obj.fill ?? 'hsl(var(--primary))'}
                stroke={obj.stroke}
                strokeWidth={obj.strokeWidth ?? 0}
                listening={false}
              />
            </Group>
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
              onDblClick={() => onTextDblClick?.(obj.id)}
              onDblTap={() => onTextDblClick?.(obj.id)}
              {...common}
            />
          );
        }
        if (obj.type === 'image') {
          return (
            <ImageShape
              key={obj.id}
              obj={obj}
              objects={objects}
              canvasW={canvasW}
              canvasH={canvasH}
              onSelect={() => onSelect(obj.id)}
              onMove={(id, x, y) => onUpdateObject(id, { x, y })}
              onUpdateObject={onUpdateObject}
              onGuidesChange={onGuidesChange}
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
              objects={objects}
              canvasW={canvasW}
              canvasH={canvasH}
              onSelect={() => onSelect(obj.id)}
              onMove={(id, x, y) => onUpdateObject(id, { x, y })}
              onUpdateObject={onUpdateObject}
              onGuidesChange={onGuidesChange}
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
  selectedId: string | null;
  onSelect: (id: string) => void;
  onUpdateObject: (id: string, patch: Partial<CanvasObjectJson>) => void;
  onStageClick: () => void;
  onTextDblClick?: (id: string) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  dropHint: string;
  readOnly?: boolean;
};

export function CanvasStageView(props: CanvasStageProps) {
  const [guides, setGuides] = useState<GuideLine[]>([]);
  const trRef = useRef<React.ComponentRef<typeof Transformer> | null>(null);
  const layerRef = useRef<React.ComponentRef<typeof Layer> | null>(null);

  useEffect(() => {
    const tr = trRef.current;
    const layer = layerRef.current;
    if (!tr || !layer) return;
    if (props.readOnly || !props.selectedId) {
      tr.nodes([]);
      tr.getLayer()?.batchDraw();
      return;
    }
    const node = layer.findOne(`#${props.selectedId}`);
    if (node) {
      tr.nodes([node]);
      tr.getLayer()?.batchDraw();
    } else {
      tr.nodes([]);
      tr.getLayer()?.batchDraw();
    }
  }, [props.selectedId, props.layout, props.readOnly]);

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
        <Layer ref={layerRef}>
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
              onTextDblClick={props.onTextDblClick}
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
          {!props.readOnly && (
            <Transformer
              ref={trRef}
              rotateEnabled
              enabledAnchors={[
                'top-left', 'top-right', 'bottom-left', 'bottom-right',
                'middle-left', 'middle-right', 'top-center', 'bottom-center',
              ]}
              borderStroke="hsl(var(--primary))"
              borderStrokeWidth={1.5}
              anchorStroke="hsl(var(--primary))"
              anchorFill="hsl(var(--background))"
              anchorSize={8}
              anchorCornerRadius={4}
              rotateAnchorOffset={28}
              boundBoxFunc={(oldBox, newBox) => {
                if (Math.abs(newBox.width) < 12 || Math.abs(newBox.height) < 12) return oldBox;
                return newBox;
              }}
            />
          )}
        </Layer>
      </Stage>
    </div>
  );
}
