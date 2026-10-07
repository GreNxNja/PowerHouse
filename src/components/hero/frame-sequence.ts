/**
 * Loads an image sequence progressively: the first `eager` frames in parallel,
 * then the rest with limited concurrency so the scrub never starves the page.
 * Frames that aren't decoded yet fall back to the nearest decoded frame.
 */
export type FrameSequenceOptions = {
  count: number;
  url: (index: number) => string;
  eager?: number;
  concurrency?: number;
  onFrame?: (index: number) => void;
};

export class FrameSequence {
  readonly frames: (HTMLImageElement | undefined)[];
  private disposed = false;
  private readonly opts: Required<FrameSequenceOptions>;

  constructor(opts: FrameSequenceOptions) {
    this.opts = { eager: 10, concurrency: 4, onFrame: () => {}, ...opts };
    this.frames = new Array(opts.count).fill(undefined);
  }

  async load() {
    const { count, eager, concurrency } = this.opts;
    const order = Array.from({ length: count }, (_, i) => i);
    await Promise.all(order.slice(0, eager).map((i) => this.loadOne(i)));

    const rest = order.slice(eager);
    const worker = async () => {
      while (rest.length > 0 && !this.disposed) {
        const i = rest.shift();
        if (i !== undefined) await this.loadOne(i);
      }
    };
    await Promise.all(Array.from({ length: concurrency }, worker));
  }

  private async loadOne(i: number) {
    if (this.disposed) return;
    const img = new Image();
    img.decoding = "async";
    img.src = this.opts.url(i);
    try {
      await img.decode();
    } catch {
      return; // a missing frame is skipped; nearest() covers the gap
    }
    if (this.disposed) return;
    this.frames[i] = img;
    this.opts.onFrame(i);
  }

  /** The decoded frame closest to `index`, preferring earlier frames. */
  nearest(index: number): HTMLImageElement | undefined {
    const { frames } = this;
    for (let d = 0; d < frames.length; d++) {
      const before = frames[index - d];
      if (before) return before;
      const after = frames[index + d];
      if (after) return after;
    }
    return undefined;
  }

  dispose() {
    this.disposed = true;
    this.frames.fill(undefined);
  }
}

/**
 * Draw `img` into the canvas like CSS `object-fit: cover` with
 * `object-position: posX posY` (0–1), so it lines up exactly with the poster.
 */
export function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  width: number,
  height: number,
  posX = 0.5,
  posY = 0.5,
) {
  const scale = Math.max(width / img.naturalWidth, height / img.naturalHeight);
  const w = img.naturalWidth * scale;
  const h = img.naturalHeight * scale;
  ctx.drawImage(img, (width - w) * posX, (height - h) * posY, w, h);
}

/** Skip the sequence on devices that asked to save data or are clearly constrained. */
export function isLowPower() {
  const nav = navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string };
    deviceMemory?: number;
  };
  if (nav.connection?.saveData) return true;
  if (/(^|-)2g|3g/.test(nav.connection?.effectiveType ?? "")) return true;
  if (nav.deviceMemory !== undefined && nav.deviceMemory < 2) return true;
  return false;
}
