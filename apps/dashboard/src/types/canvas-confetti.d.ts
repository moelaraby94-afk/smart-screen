declare module 'canvas-confetti' {
  interface Options {
    particleCount?: number;
    spread?: number;
    origin?: { x?: number; y?: number };
    zIndex?: number;
    [key: string]: unknown;
  }
  function confetti(options?: Options): Promise<unknown> | null;
  namespace confetti {
    function create(canvas: HTMLCanvasElement): (options?: Options) => Promise<unknown> | null;
  }
  export = confetti;
}
