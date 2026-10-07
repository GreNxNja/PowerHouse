/**
 * Hero image sequence from a video, decoded in Microsoft Edge via Playwright
 * (no ffmpeg needed). Writes the frames, the frame manifest and the poster.
 *
 *   npm run frames -- "path/to/video.mp4"
 *
 What it does, in order:
 *   1. Takes source frames RANGE[0]..RANGE[1] (every frame, unless that is
 *      more than MAX_COUNT, then evenly sampled), cropped to CROP to keep the
 *      generator watermark out, and REVERSEd if the segment runs
 *      lockout -> setup, so the scrub always reads setup -> pull -> lockout.
 *   2. Writes public/frames/<width>/frame-0001.webp … at each SIZE,
 *      src/components/hero/frames.json, and assets/images/hero/poster.jpg
 *      (frame 1, so the poster-to-canvas handoff is invisible).
 *
 * Then run `npm run images` to rebuild the poster's responsive versions.
 */
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "@playwright/test";
import sharp from "sharp";

/**
 * Current clip (hero vid.mp4, 10 s, 24 fps, 1280x720), bar height tracked per
 * frame (plate centroid; bigger y = lower):
 *   0–21 lockout hold (y≈428) · 21–60 lowering to the floor (→548)
 *   60–75 REBOUND off the floor (→509) · 75–90 back down (→553)
 *   90–168 setup · 168–211 clean pull (555→444) · 211–239 drop
 * We use 59 → 0 reversed: 60 frames, one direction only, ending on the
 * lockout hold with the chalk puff. Anything past ~60 includes the rebound,
 * which plays as the lifter bouncing the bar. Fewer than Section 3's 90, so
 * the canvas blends neighbouring frames to keep the scrub smooth.
 */
const RANGE: [number, number] = [0, 59]; // 59 is the lowest point; 60 is a hair higher
const REVERSE = true;
const MAX_COUNT = 150; // Section 3 asks for 90–150
const CROP = { left: 0, top: 0, width: 1110, height: 720 }; // drops the watermark
const SIZES = [640, 800, 1110]; // never above the crop width: no upscaling. 800 suits phones (band)
const QUALITY = 66;
/**
 * Horizontal object-position (0–1) for poster and canvas. The lifter spans
 * ~0.40–0.77 of the cropped frame (centre ~0.585). Phone band (80% of the
 * width visible): 0.925 centres them. Cover elsewhere (tablet portrait shows
 * ~52%): 0.68. Re-check if the footage or CROP changes.
 */
const POSITION = { band: 0.925, cover: 0.68 };

const ROOT = process.cwd();
const input = process.argv[2];
if (!input) throw new Error('Usage: npm run frames -- "path/to/video.mp4"');

const browser = await chromium.launch({ channel: "msedge" });
const page = await browser.newPage();
await page.setContent("<video muted playsinline></video><canvas></canvas>");
const video = (await readFile(input)).toString("base64");

const meta = await page.evaluate(async (data) => {
  const bytes = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
  const v = document.querySelector("video") as HTMLVideoElement;
  v.src = URL.createObjectURL(new Blob([bytes], { type: "video/mp4" }));
  await new Promise((resolve, reject) => {
    v.onloadeddata = resolve;
    v.onerror = () =>
      reject(new Error(`Edge could not decode the video (${v.error?.code})`));
  });
  // Frame rate from presented frames.
  let n = 0;
  let first = 0;
  let last = 0;
  await new Promise<void>((done) => {
    const cb: VideoFrameRequestCallback = (_, m) => {
      if (n === 0) first = m.mediaTime;
      last = m.mediaTime;
      n++;
      if (n < 30) v.requestVideoFrameCallback(cb);
      else {
        v.pause();
        done();
      }
    };
    v.requestVideoFrameCallback(cb);
    void v.play();
  });
  return {
    duration: v.duration,
    width: v.videoWidth,
    height: v.videoHeight,
    fps: Math.round((n - 1) / (last - first)),
  };
}, video);

const total = Math.floor(meta.duration * meta.fps);
console.log(
  `source ${meta.width}x${meta.height}, ${meta.fps} fps, ${total} frames`,
);
if (
  CROP.left + CROP.width > meta.width ||
  CROP.top + CROP.height > meta.height
) {
  throw new Error("CROP is outside the video");
}

/** Seek to source frame i and return it from the canvas. */
const grab = (
  i: number,
  w: number,
  h: number,
  crop: typeof CROP | null,
  type: string,
) =>
  page.evaluate(
    async ({ t, w, h, crop, type }) => {
      const v = document.querySelector("video") as HTMLVideoElement;
      const c = document.querySelector("canvas") as HTMLCanvasElement;
      v.currentTime = t;
      await new Promise((r) => {
        v.onseeked = r;
      });
      c.width = w;
      c.height = h;
      const ctx = c.getContext("2d") as CanvasRenderingContext2D;
      if (crop)
        ctx.drawImage(
          v,
          crop.left,
          crop.top,
          crop.width,
          crop.height,
          0,
          0,
          w,
          h,
        );
      else ctx.drawImage(v, 0, 0, w, h);
      if (type === "raw") return Array.from(ctx.getImageData(0, 0, w, h).data);
      return c.toDataURL(type, 0.95).split(",")[1];
    },
    { t: (i + 0.5) / meta.fps, w, h, crop, type },
  );

// 1. Pick, order.
const [start, end] = RANGE;
if (end >= total)
  throw new Error(`RANGE ends past the last frame (${total - 1})`);
const COUNT = Math.min(end - start + 1, MAX_COUNT);
const picks = Array.from({ length: COUNT }, (_, k) =>
  Math.round(start + (k * (end - start)) / (COUNT - 1)),
);
if (REVERSE) picks.reverse();

// 2. Write.
const OUT = path.join(ROOT, "public/frames");
await rm(OUT, { recursive: true, force: true });
for (const s of SIZES)
  await mkdir(path.join(OUT, String(s)), { recursive: true });

let bytes = 0;
for (let k = 0; k < picks.length; k++) {
  const b64 = (await grab(
    picks[k],
    CROP.width,
    CROP.height,
    CROP,
    "image/png",
  )) as string;
  const frame = sharp(Buffer.from(b64, "base64"));
  const name = `frame-${String(k + 1).padStart(4, "0")}.webp`;
  for (const size of SIZES) {
    const info = await frame
      .clone()
      .resize({ width: size })
      .webp({ quality: QUALITY, effort: 5 })
      .toFile(path.join(OUT, String(size), name));
    if (size === SIZES[SIZES.length - 1]) bytes += info.size;
  }
  if (k === 0) {
    await mkdir(path.join(ROOT, "assets/images/hero"), { recursive: true });
    await frame
      .clone()
      .jpeg({ quality: 90 })
      .toFile(path.join(ROOT, "assets/images/hero/poster.jpg"));
  }
}
await browser.close();

await writeFile(
  path.join(ROOT, "src/components/hero/frames.json"),
  `${JSON.stringify({ count: COUNT, sizes: SIZES, width: CROP.width, height: CROP.height, position: POSITION }, null, 2)}\n`,
);
console.log(
  `${COUNT} frames x ${SIZES.length} sizes; largest set ${(bytes / 1024).toFixed(0)} KB. Poster: assets/images/hero/poster.jpg`,
);
