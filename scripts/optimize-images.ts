/**
 * Image pipeline. Reads sources from assets/images/** (jpg, png, webp, avif),
 * writes AVIF + WebP at fixed widths to public/img/**, and a manifest with
 * intrinsic sizes to src/content/images.json for the <Picture> component.
 *
 *   npm run images           only rebuilds sources newer than their outputs
 *   npm run images -- --force
 *
 * Widths never upscale: a 1200px source gets 640 and 960, plus its own width.
 */
import { mkdir, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "assets/images");
const OUT = path.join(ROOT, "public/img");
const MANIFEST = path.join(ROOT, "src/content/images.json");
const WIDTHS = [640, 960, 1440, 1920];
const EXTS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);
const force = process.argv.includes("--force");

type Entry = { width: number; height: number; widths: number[] };

async function walk(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((e) => {
      const full = path.join(dir, e.name);
      return e.isDirectory() ? walk(full) : Promise.resolve([full]);
    }),
  );
  return files.flat().filter((f) => EXTS.has(path.extname(f).toLowerCase()));
}

async function mtime(file: string) {
  try {
    return (await stat(file)).mtimeMs;
  } catch {
    return 0;
  }
}

function targetWidths(sourceWidth: number) {
  const widths = WIDTHS.filter((w) => w < sourceWidth);
  // Always include the source width (capped at the largest target).
  widths.push(Math.min(sourceWidth, WIDTHS[WIDTHS.length - 1]));
  return [...new Set(widths)].sort((a, b) => a - b);
}

const sources = await walk(SRC);
const manifest: Record<string, Entry> = {};
let built = 0;

for (const file of sources) {
  const key = path
    .relative(SRC, file)
    .replace(/\\/g, "/")
    .replace(/\.[^.]+$/, "");
  if (key in manifest) {
    throw new Error(
      `Two sources for "${key}" (e.g. .jpg and .webp). Delete one in assets/images/.`,
    );
  }
  const image = sharp(file).rotate(); // respect EXIF orientation
  const meta = await image.metadata();
  if (!meta.width || !meta.height) throw new Error(`No dimensions: ${file}`);
  const widths = targetWidths(meta.width);
  manifest[key] = {
    width: meta.width,
    height: meta.height,
    widths,
  };

  const srcTime = await mtime(file);
  const largest = path.join(OUT, `${key}-${widths[widths.length - 1]}.avif`);
  if (!force && (await mtime(largest)) > srcTime) continue;

  await mkdir(path.dirname(path.join(OUT, key)), { recursive: true });
  await Promise.all(
    widths.flatMap((w) => {
      const resized = image
        .clone()
        .resize({ width: w, withoutEnlargement: true });
      return [
        resized
          .clone()
          .avif({ quality: 50, effort: 4 })
          .toFile(path.join(OUT, `${key}-${w}.avif`)),
        resized
          .clone()
          .webp({ quality: 72 })
          .toFile(path.join(OUT, `${key}-${w}.webp`)),
      ];
    }),
  );
  built++;
  console.log(`  ${key}  ${meta.width}x${meta.height} -> ${widths.join(", ")}`);
}

const sorted = Object.fromEntries(
  Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)),
);
await writeFile(MANIFEST, `${JSON.stringify(sorted, null, 2)}\n`);
console.log(
  `Optimized ${built} of ${sources.length} images. Manifest: ${path.relative(ROOT, MANIFEST)}`,
);
