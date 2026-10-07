/**
 * Generates labelled placeholder sources in assets/images/ until real
 * photography exists. Never overwrites a file that is already there, so real
 * photos dropped in with the same name always win.
 *
 *   npm run images:placeholders && npm run images
 */
import { access, mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const SRC = path.join(process.cwd(), "assets/images");

const portrait = { width: 1500, height: 2000 }; // 3:4, matches the trainer photos
const classCard = { width: 1500, height: 2000 }; // 3:4, matches the class photos

const images: Record<string, { width: number; height: number; label: string }> =
  {
    "hero/poster": {
      width: 1920,
      height: 1080,
      label: "Hero poster: heavy deadlift lockout",
    },
    "gym/floor": {
      width: 2000,
      height: 1500,
      label: "Gym floor: racks and platforms",
    },
    "classes/strength-foundations": {
      ...classCard,
      label: "Strength foundations",
    },
    "classes/barbell-strength": { ...classCard, label: "Barbell strength" },
    "classes/powerlifting-club": { ...classCard, label: "Powerlifting club" },
    "classes/olympic-lifting": { ...classCard, label: "Olympic lifting" },
    "classes/kettlebell-conditioning": {
      ...classCard,
      label: "Kettlebell conditioning",
    },
    "classes/engine": { ...classCard, label: "Engine" },
    "classes/mobility-and-recovery": {
      ...classCard,
      label: "Mobility and recovery",
    },
    "classes/build": { ...classCard, label: "Build" },
    "trainers/maya-okafor": { ...portrait, label: "Maya Okafor" },
    "trainers/daniel-reyes": { ...portrait, label: "Daniel Reyes" },
    "trainers/priya-nair": { ...portrait, label: "Priya Nair" },
    "trainers/tom-becker": { ...portrait, label: "Tom Becker" },
  };

function svg(width: number, height: number, label: string, seed: number) {
  const r = Math.min(width, height);
  const cx = width * (0.55 + (seed % 5) * 0.06);
  const cy = height * 0.5;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#2c3236"/><stop offset="1" stop-color="#1d2225"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <circle cx="${cx}" cy="${cy}" r="${r * 0.38}" fill="none" stroke="#c9cccb" stroke-opacity="0.18" stroke-width="${r * 0.06}"/>
  <circle cx="${cx}" cy="${cy}" r="${r * 0.08}" fill="#c9cccb" fill-opacity="0.18"/>
  <rect x="0" y="${cy - r * 0.012}" width="100%" height="${r * 0.024}" fill="#c9cccb" fill-opacity="0.12"/>
  <text x="${width * 0.04}" y="${width * 0.06}" font-family="Arial, sans-serif" font-size="${Math.round(width * 0.032)}" font-weight="700" fill="#f3f5f4" fill-opacity="0.7">Placeholder: ${label}</text>
</svg>`;
}

const EXTS = [".jpg", ".jpeg", ".png", ".webp", ".avif"];

/** True if a source exists for this key in any supported format. */
async function exists(key: string) {
  for (const ext of EXTS) {
    try {
      await access(path.join(SRC, `${key}${ext}`));
      return true;
    } catch {}
  }
  return false;
}

let i = 0;
for (const [key, { width, height, label }] of Object.entries(images)) {
  i++;
  const file = path.join(SRC, `${key}.jpg`);
  if (await exists(key)) continue; // real or existing image: leave it alone
  await mkdir(path.dirname(file), { recursive: true });
  await sharp(Buffer.from(svg(width, height, label, i)))
    .jpeg({ quality: 85 })
    .toFile(file);
  console.log(`  ${key}.jpg`);
}
