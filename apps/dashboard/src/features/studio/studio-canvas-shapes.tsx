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
import type { CanvasLayoutV1, CanvasObjectJson } from '@/features/studio/canvas-layout';

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
      draggable
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

type CanvasRendererProps = {
  objects: CanvasObjectJson[];
  onSelect: (id: string) => void;
  onUpdateObject: (id: string, patch: Partial<CanvasObjectJson>) => void;
};

export function CanvasObjectsRenderer({ objects, onSelect, onUpdateObject }: CanvasRendererProps) {
  return (
    <>
      {objects.map((obj) => {
        const common = {
          id: obj.id,
          name: obj.id,
          rotation: obj.rotation ?? 0,
          opacity: obj.opacity ?? 1,
          draggable: true as const,
          onClick: (e: { cancelBubble: boolean }) => {
            e.cancelBubble = true;
            onSelect(obj.id);
          },
          onDragEnd: (e: {
            target: { x: () => number; y: () => number; getLayer: () => unknown };
          }) => {
            const n = e.target;
            onUpdateObject(obj.id, { x: n.x(), y: n.y() });
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
            />
          </Group>
        </Layer>
      </Stage>
    </div>
  );
}
