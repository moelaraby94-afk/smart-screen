'use client';

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

type TooltipData = {
  content: string;
  position?: TooltipPosition;
};

type TooltipContextValue = {
  show: (data: TooltipData) => void;
  hide: () => void;
  current: TooltipData | null;
};

const TooltipContext = createContext<TooltipContextValue | null>(null);

export function TooltipProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<TooltipData | null>(null);

  const show = useCallback((data: TooltipData) => setCurrent(data), []);
  const hide = useCallback(() => setCurrent(null), []);

  return (
    <TooltipContext.Provider value={{ show, hide, current }}>
      {children}
    </TooltipContext.Provider>
  );
}

export function useTooltip() {
  const ctx = useContext(TooltipContext);
  if (!ctx) throw new Error('useTooltip must be used within TooltipProvider');
  return ctx;
}
