/**
 * Textures and overlays. Unlike photos these are used from CSS (tiled) or as a
 * single hero layer, so each gets a fixed crop and fixed output sizes instead
 * of the responsive pipeline.
 *
 *   npm run textures
 *
 * Crops keep the generator watermark (bottom-right of each source) out, which
 * matters most for tiles: anything left in would repeat across the page.
 * The concrete crop lands on panel joints (every 500px), so it still tiles.
 */
import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const SRC = path.join(process.cwd(), "assets/textures");
const OUT = path.join(process.cwd(), "public/img/textures");

type Job = {
  source: string;
  crop: { left: number; top: number; width: number; height: number };
  widths: number[];
  quality: number;
};

const jobs: Record<string, Job> = {
  // Rubber floor, tiled on iron surfaces.
  rubber: {
    source: "rubber.webp",
    crop: { left: 0, top: 0, width: 1200, height: 1200 },
    widths: [600],
    quality: 70,
  },
  // Board-formed concrete, tiled on concrete sections. 3×3 panels.
  concrete: {
    source: "concrete.webp",
    crop: { left: 0, top: 0, width: 1500, height: 1500 },
    widths: [900],
    quality: 72,
  },
  // Chalk burst on black, screened over the hero at lockout.
  chalk: {
    source: "chalk.webp",
    crop: { left: 0, top: 0, width: 1740, height: 1116 },
    widths: [960, 1600],
    quality: 70,
  },
};

await mkdir(OUT, { recursive: true });
for (const [name, job] of Object.entries(jobs)) {
  for (const width of job.widths) {
    const file = path.join(OUT, `${name}-${width}.webp`);
    const info = await sharp(path.join(SRC, job.source))
      .extract(job.crop)
      .resize({ width })
      .webp({ quality: job.quality, effort: 5 })
      .toFile(file);
    console.log(
      `  textures/${name}-${width}.webp  ${info.width}x${info.height}  ${Math.round(info.size / 1024)} KB`,
    );
  }
}
