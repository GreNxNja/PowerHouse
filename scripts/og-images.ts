/**
 * Open Graph cards (1200×630) for every route, written to public/og/.
 * Background: assets/og/background.* (cropped to the middle band).
 * Type: Archivo Expanded Black / Archivo, from assets/fonts (see README there).
 *
 *   npm run og
 *
 * Re-run after changing page headlines, class names or prices. The cards are
 * committed like the other generated images, so CI never needs to run this.
 */
import { mkdir, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "public/og");
const FONT = path.join(ROOT, "assets/fonts/archivo-latin-variable.ttf");
const W = 1200;
const H = 630;
const PAD = 72;

const readJson = async <T>(p: string): Promise<T> =>
  JSON.parse(await readFile(path.join(ROOT, p), "utf8")) as T;

type Gym = { name: string; locale: string; currency: string };
type GymClass = { slug: string; name: string; summary: string };
type Membership = { plans: { annualMonthly: number }[] };

const gym = await readJson<Gym>("src/content/gym.json");
const classes = await readJson<GymClass[]>("src/content/classes.json");
const membership = await readJson<Membership>("src/content/membership.json");

const fromPrice = new Intl.NumberFormat(gym.locale, {
  style: "currency",
  currency: gym.currency,
  maximumFractionDigits: 0,
}).format(Math.min(...membership.plans.map((p) => p.annualMonthly)));

/** Card text mirrors each page's <h1> and intro. Keep them in step. */
const cards: { file: string; title: string; subtitle: string }[] = [
  {
    file: "home",
    title: "Lift heavy. Get coached properly.",
    subtitle:
      "Strength classes, open gym and a free first session with a coach.",
  },
  {
    file: "classes",
    title: "Every class is coached.",
    subtitle:
      "Strength, Olympic lifting, conditioning and mobility. Beginners welcome.",
  },
  {
    file: "trainers",
    title: "The people watching your reps.",
    subtitle: "Meet the coaching team.",
  },
  {
    file: "membership",
    title: "Pick how much coaching you want.",
    subtitle: `Plans from ${fromPrice} a month. Your first session is free.`,
  },
  {
    file: "timetable",
    title: "This week on the floor.",
    subtitle: "Coached classes from early mornings to weekends.",
  },
  {
    file: "contact",
    title: "Come and lift with us.",
    subtitle: "Book a free session with a coach.",
  },
  ...classes.map((c) => ({
    file: `classes/${c.slug}`,
    title: c.name,
    subtitle: c.summary,
  })),
];

const escapeMarkup = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

async function text(
  content: string,
  font: string,
  color: string,
  width: number,
): Promise<{ input: Buffer; width: number; height: number }> {
  const input = await sharp({
    text: {
      text: `<span foreground="${color}">${escapeMarkup(content)}</span>`,
      font,
      fontfile: FONT,
      width,
      rgba: true,
      dpi: 72,
      spacing: 4,
    },
  })
    .png()
    .toBuffer();
  const meta = await sharp(input).metadata();
  return { input, width: meta.width ?? 0, height: meta.height ?? 0 };
}

// Background: cover-crop the middle band, then a scrim for legibility.
const bgFile = (await readdir(path.join(ROOT, "assets/og"))).find((f) =>
  f.startsWith("background."),
);
if (!bgFile) throw new Error("Missing assets/og/background.(webp|jpg|png)");
const background = await sharp(path.join(ROOT, "assets/og", bgFile))
  .resize(W, H, { fit: "cover", position: "centre" })
  .toBuffer();

const scrim =
  Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="side" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#1d2225" stop-opacity="0.94"/>
      <stop offset="0.55" stop-color="#1d2225" stop-opacity="0.7"/>
      <stop offset="1" stop-color="#1d2225" stop-opacity="0.15"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#side)"/>
  <rect x="${PAD}" y="${PAD + 58}" width="72" height="8" fill="#3b2bff"/>
</svg>`);

const wordmark = await text(
  gym.name,
  "Archivo Expanded Black 30",
  "#f3f5f4",
  600,
);

await mkdir(path.join(OUT, "classes"), { recursive: true });

for (const card of cards) {
  // Long titles step down a size so they fit in three lines.
  const size = card.title.length > 26 ? 60 : 72;
  const title = await text(
    card.title,
    `Archivo Expanded Black ${size}`,
    "#f3f5f4",
    820,
  );
  const subtitle = await text(
    card.subtitle,
    "Archivo Medium 28",
    "#c9cccb",
    720,
  );

  const subtitleTop = H - PAD - subtitle.height;
  const titleTop = subtitleTop - 28 - title.height;

  await sharp(background)
    .composite([
      { input: scrim, top: 0, left: 0 },
      { input: wordmark.input, top: PAD, left: PAD },
      { input: title.input, top: titleTop, left: PAD },
      { input: subtitle.input, top: subtitleTop, left: PAD },
    ])
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(path.join(OUT, `${card.file}.jpg`));
  console.log(`  og/${card.file}.jpg`);
}
console.log(`${cards.length} cards in public/og/`);
