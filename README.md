# PowerHouse

Website for PowerHouse, a strength gym. A fully static Next.js site (no server at
runtime) whose main job is getting visitors to book a free first session.

The build plan, decisions and verification notes for each phase live in
[WORKFLOW.md](WORKFLOW.md). Content (classes, trainers, timetable, prices) lives
in [src/content](src/content), see its [README](src/content/README.md).

## Stack

Next.js 16 (App Router, `output: "export"`), React 19, TypeScript, Tailwind CSS v4,
shadcn/ui, Motion, GSAP + ScrollTrigger + SplitText, Lenis, react-hook-form + zod,
Web3Forms for the booking form, Plausible for analytics, Biome for lint and format.

## Getting started

Requires Node 24 (see `.nvmrc`).

```bash
npm install
cp .env.example .env.local   # then fill in the values you need
npm run dev
```

`npm run dev` prints the address to open on a phone on the same Wi-Fi.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server, plus the LAN address for testing on a phone |
| `npm run build` | Static export to `out/` |
| `npm run check` | Biome, typecheck, then build |
| `npm run images` | Optimise `assets/images/**` into `public/img` (AVIF + WebP) |
| `npm run frames -- "<video>"` | Extract the hero scroll sequence from a video |
| `npm run textures` | Crop and export the CSS textures and hero chalk overlay |
| `npm run og` | Render the Open Graph cards into `public/og` |

## Environment

All values are public and baked in at build time (see `.env.example`):

- `NEXT_PUBLIC_SITE_URL`: the live origin. Must be set for production builds, because social card URLs use it.
- `NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY`: turns on the booking form.
- `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`: turns on analytics.

## Deploy

Any static host. Build command `npm run build`, output directory `out`.
