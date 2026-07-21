'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Ellipse, Group, Image as KonvaImage, Layer, Line as KonvaLine, Rect, Stage, Text } from 'react-konva';
import useImage from 'use-image';
import QRCode from 'qrcode';
import {
  type CanvasLayoutV1,
  type CanvasObjectJson,
  parseCanvasLayout,
} from '@/types/canvas-layout';

type Props = {
  designWidth: number;
  designHeight: number;
  layoutData: unknown;
  liveOverride?: unknown | null;
};

function CanvasImageNode({ obj }: { obj: CanvasObjectJson }) {
  const [img] = useImage(obj.imageUrl ?? '', 'anonymous');
  if (!img || !obj.width || !obj.height) return null;
  return (
    <KonvaImage
      image={img}
      x={obj.x}
      y={obj.y}
      width={obj.width}
      height={obj.height}
      rotation={obj.rotation ?? 0}
      opacity={obj.opacity ?? 1}
      scaleX={obj.scaleX ?? 1}
      scaleY={obj.scaleY ?? 1}
    />
  );
}

function ObjectNode({ obj }: { obj: CanvasObjectJson }) {
  const common = {
    rotation: obj.rotation ?? 0,
    opacity: obj.opacity ?? 1,
    scaleX: obj.scaleX ?? 1,
    scaleY: obj.scaleY ?? 1,
  };

  if (obj.type === 'rect') {
    return (
      <Rect
        x={obj.x}
        y={obj.y}
        width={obj.width ?? 120}
        height={obj.height ?? 80}
        fill={obj.fill ?? '#4b0082'}
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
        x={obj.x + rw}
        y={obj.y + rh}
        radiusX={rw}
        radiusY={rh}
        fill={obj.fill ?? '#4b0082'}
        stroke={obj.stroke}
        strokeWidth={obj.strokeWidth ?? 0}
        {...common}
      />
    );
  }
  if (obj.type === 'text') {
    return (
      <Text
        x={obj.x}
        y={obj.y}
        text={obj.text ?? ''}
        fontSize={obj.fontSize ?? 48}
        fontFamily={
          obj.fontFamily ??
          '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", sans-serif'
        }
        fontStyle={obj.fontStyle ?? 'normal'}
        fill={obj.fill ?? '#ffd700'}
        align={obj.align ?? 'left'}
        verticalAlign={obj.verticalAlign ?? 'top'}
        width={obj.width}
        height={obj.height}
        {...common}
      />
    );
  }
  if (obj.type === 'image') {
    return <CanvasImageNode obj={obj} />;
  }
  if (obj.type === 'zone') {
    return (
      <Rect
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
        x={obj.x}
        y={obj.y}
        points={obj.points ?? [0, 0, obj.width ?? 200, 0]}
        stroke={obj.stroke ?? obj.fill ?? '#ffffff'}
        strokeWidth={obj.strokeWidth ?? 4}
        lineCap="round"
        {...common}
      />
    );
  }
  if (obj.type === 'arrow') {
    return (
      <KonvaLine
        x={obj.x}
        y={obj.y}
        points={obj.points ?? [0, 0, obj.width ?? 200, 0]}
        stroke={obj.stroke ?? obj.fill ?? '#ffffff'}
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
    return <CanvasQrCodeNode obj={obj} />;
  }
  return null;
}

function CanvasQrCodeNode({ obj }: { obj: CanvasObjectJson }) {
  const [dataUrl, setDataUrl] = useState('');
  const [img] = useImage(dataUrl, 'anonymous');
  useEffect(() => {
    QRCode.toDataURL(obj.qrData || 'https://smartscreen.app', { width: 256, margin: 1 })
      .then(setDataUrl)
      .catch(() => {});
  }, [obj.qrData]);
  if (!img || !obj.width || !obj.height) return null;
  return <KonvaImage image={img} x={obj.x} y={obj.y} width={obj.width} height={obj.height} opacity={obj.opacity ?? 1} />;
}

export function CanvasKonvaView({ designWidth, designHeight, layoutData, liveOverride }: Props) {
  const doc: CanvasLayoutV1 = useMemo(
    () => parseCanvasLayout(liveOverride ?? layoutData),
    [layoutData, liveOverride],
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 800, h: 450 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect;
      if (cr) setSize({ w: cr.width, h: cr.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /** Cover viewport (like object-fit: cover) — no letterboxing on mixed aspect ratios. */
  const scale = Math.min(Math.max(size.w / designWidth, size.h / designHeight), 4);
  const ox = (size.w - designWidth * scale) / 2;
  const oy = (size.h - designHeight * scale) / 2;

  return (
    <div ref={containerRef} className="flex h-full w-full items-center justify-center bg-black">
      <Stage width={size.w} height={size.h}>
        <Layer>
          <Rect x={0} y={0} width={size.w} height={size.h} fill="#030712" />
          <Group x={ox} y={oy} scaleX={scale} scaleY={scale}>
            <Rect x={0} y={0} width={designWidth} height={designHeight} fill="#030712" />
            {doc.objects.map((obj) => (
              <ObjectNode key={obj.id} obj={obj} />
            ))}
          </Group>
        </Layer>
      </Stage>
    </div>
  );
}
