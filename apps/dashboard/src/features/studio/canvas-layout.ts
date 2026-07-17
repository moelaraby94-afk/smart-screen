export type CanvasObjectJson = {
  id: string;
  type: 'text' | 'image' | 'rect' | 'ellipse' | 'zone' | 'line' | 'arrow' | 'qrcode';
  x: number;
  y: number;
  rotation?: number;
  opacity?: number;
  scaleX?: number;
  scaleY?: number;
  width?: number;
  height?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  cornerRadius?: number;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontStyle?: string;
  align?: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  imageUrl?: string;
  mediaId?: string;
  zoneName?: string;
  zonePlaylistId?: string | null;
  zoneMediaId?: string | null;
  points?: number[];
  qrData?: string;
  locked?: boolean;
  fitMode?: 'contain' | 'cover' | 'fill';
  duration?: number;
};

export type ZonePreset = {
  id: string;
  name: string;
  nameAr: string;
  zones: Array<{ x: number; y: number; width: number; height: number; name: string }>;
};

export function makeZonePresets(dw: number, dh: number): ZonePreset[] {
  return [
    {
      id: 'split-horizontal',
      name: 'Split Horizontal (2 zones)',
      nameAr: 'تقسيم أفقي (منطقتان)',
      zones: [
        { x: 0, y: 0, width: dw, height: dh / 2, name: 'Top' },
        { x: 0, y: dh / 2, width: dw, height: dh / 2, name: 'Bottom' },
      ],
    },
    {
      id: 'split-vertical',
      name: 'Split Vertical (2 zones)',
      nameAr: 'تقسيم عمودي (منطقتان)',
      zones: [
        { x: 0, y: 0, width: dw / 2, height: dh, name: 'Left' },
        { x: dw / 2, y: 0, width: dw / 2, height: dh, name: 'Right' },
      ],
    },
    {
      id: 'split-3zone-l',
      name: 'L-Shape (3 zones)',
      nameAr: 'شكل L (3 مناطق)',
      zones: [
        { x: 0, y: 0, width: dw * 0.3, height: dh, name: 'Sidebar' },
        { x: dw * 0.3, y: 0, width: dw * 0.7, height: dh * 0.6, name: 'Main' },
        { x: dw * 0.3, y: dh * 0.6, width: dw * 0.7, height: dh * 0.4, name: 'Bottom' },
      ],
    },
    {
      id: 'split-4zone',
      name: 'Grid (4 zones)',
      nameAr: 'شبكة (4 مناطق)',
      zones: [
        { x: 0, y: 0, width: dw / 2, height: dh / 2, name: 'Top-Left' },
        { x: dw / 2, y: 0, width: dw / 2, height: dh / 2, name: 'Top-Right' },
        { x: 0, y: dh / 2, width: dw / 2, height: dh / 2, name: 'Bottom-Left' },
        { x: dw / 2, y: dh / 2, width: dw / 2, height: dh / 2, name: 'Bottom-Right' },
      ],
    },
    {
      id: 'split-main-ticker',
      name: 'Main + Ticker',
      nameAr: 'رئيسي + شريط',
      zones: [
        { x: 0, y: 0, width: dw, height: dh * 0.85, name: 'Main' },
        { x: 0, y: dh * 0.85, width: dw, height: dh * 0.15, name: 'Ticker' },
      ],
    },
  ];
}

export type CanvasLayoutV1 = {
  version: 1;
  objects: CanvasObjectJson[];
};

export function emptyLayout(): CanvasLayoutV1 {
  return { version: 1, objects: [] };
}
