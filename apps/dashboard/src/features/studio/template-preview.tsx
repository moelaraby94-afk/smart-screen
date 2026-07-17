'use client';

import { useEffect, useRef, useState } from 'react';
import { Layer, Rect, Stage, Text, Ellipse, Line as KonvaLine, Group } from 'react-konva';
import type { CanvasLayoutV1, CanvasObjectJson } from '@/features/studio/canvas-layout';

type Props = {
  layout: CanvasLayoutV1;
  width: number;
  height: number;
  className?: string;
};

export function TemplatePreview({ layout, width, height, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 300, h: 169 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setIsVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: '200px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !isVisible) return;
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect;
      if (cr) {
        const aspectRatio = width / height;
        const containerW = cr.width;
        const containerH = containerW / aspectRatio;
        setSize({ w: containerW, h: containerH });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [width, height, isVisible]);

  const scale = size.w / width;

  return (
    <div ref={containerRef} className={className} style={{ aspectRatio: `${width} / ${height}` }}>
      {isVisible ? (
        <Stage width={size.w} height={size.h}>
          <Layer>
            <Rect x={0} y={0} width={size.w} height={size.h} fill="hsl(var(--background))" />
            <Group scaleX={scale} scaleY={scale}>
              {layout.objects.map((obj) => (
                <PreviewShape key={obj.id} obj={obj} />
              ))}
            </Group>
          </Layer>
        </Stage>
      ) : (
        <div className="h-full w-full animate-pulse bg-muted/30" />
      )}
    </div>
  );
}

function PreviewShape({ obj }: { obj: CanvasObjectJson }) {
  const common = {
    x: obj.x,
    y: obj.y,
    rotation: obj.rotation ?? 0,
    opacity: obj.opacity ?? 1,
  };

  if (obj.type === 'rect') {
    return (
      <Rect
        {...common}
        width={obj.width ?? 120}
        height={obj.height ?? 80}
        fill={obj.fill ?? 'hsl(var(--primary))'}
        stroke={obj.stroke}
        strokeWidth={obj.strokeWidth ?? 0}
        cornerRadius={obj.cornerRadius ?? 0}
        listening={false}
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
        fill={obj.fill ?? 'hsl(var(--primary))'}
        opacity={obj.opacity ?? 1}
        listening={false}
      />
    );
  }

  if (obj.type === 'text') {
    return (
      <Text
        {...common}
        text={obj.text ?? ''}
        fontSize={obj.fontSize ?? 48}
        fontFamily={obj.fontFamily ?? '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif'}
        fontStyle={obj.fontStyle ?? 'normal'}
        align={obj.align ?? 'left'}
        verticalAlign={obj.verticalAlign ?? 'top'}
        fill={obj.fill ?? 'hsl(var(--primary))'}
        width={obj.width}
        listening={false}
      />
    );
  }

  if (obj.type === 'line' && obj.points) {
    return (
      <KonvaLine
        points={obj.points}
        stroke={obj.stroke ?? 'hsl(var(--primary))'}
        strokeWidth={obj.strokeWidth ?? 2}
        opacity={obj.opacity ?? 1}
        listening={false}
      />
    );
  }

  if (obj.type === 'arrow' && obj.points) {
    return (
      <KonvaLine
        points={obj.points}
        stroke={obj.stroke ?? 'hsl(var(--primary))'}
        strokeWidth={obj.strokeWidth ?? 2}
        pointerLength={10}
        pointerWidth={10}
        opacity={obj.opacity ?? 1}
        listening={false}
      />
    );
  }

  return null;
}
