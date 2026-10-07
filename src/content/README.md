# Content

Everything the site says lives here as JSON, validated by the zod schemas in
`src/lib/schemas.ts` when `src/content/index.ts` is imported during the build.
Bad content fails `npm run build` with a message naming the file and field.

Cross-checks in `index.ts` also catch:

- classes or timetable entries pointing at a coach or class that doesn't exist
- a timetable session run by a trainer not listed as that class's coach
- a session whose length doesn't match the class duration
- sessions outside opening hours, or a trainer double-booked
- images missing from `images.json`
- comparison rows missing a plan, or an annual price above the monthly one

## Placeholder content

`gym.json` has `"placeholder": true`. Everything below is invented and must be
confirmed or replaced before launch:

| File | What's invented |
| --- | --- |
| `gym.json` | Gallery and exterior captions, address, phone (fictional 555-01xx range), email (`.example` domain), hours, prices in INR (locale en-IN: ₹2,500, “5:30 am”, Indian digit grouping) |
| `classes.json` | All eight classes and their copy |
| `trainers.json` | All four trainers, bios and qualifications. Bios avoid pronouns, so names and photos can be swapped freely; if real bios use pronouns, use the ones each coach uses |
| `membership.json` | Plans, prices (₹2,500 / ₹6,000 / ₹8,500 monthly; ₹2,000 / ₹5,000 / ₹7,000 a month annually; ₹500 drop-in), policies and FAQs |
| `timetable.json` | The whole week |
| `assets/images/**` | No placeholder images remain. The hero frames and poster come from the supplied video (`npm run frames`, see WORKFLOW.md Phase 3). The four trainer portraits, all eight class photos and `gym/intro-session` (3:4), the five facility photos in `gym/` (4:3) and the night exterior `gym/exterior` (16:9) are supplied images. Check you have the rights to use them, and remove the generator watermark in the bottom-right corner, before launch |

Set `geo` in `gym.json` to show the map on /contact (and, in Phase 6, the
JSON-LD coordinates).

## Textures

`npm run textures` crops and exports `assets/textures/*` to `public/img/textures/`. Each crop keeps the generator watermark out; a watermark left in a tile would repeat across the page.

- `rubber` (600px tile): grain on every `.surface-iron` block (footer, booking boxes, highlighted plan), tinted 80% iron.
- `concrete` (900px tile, 3×3 panels, cropped on the joints so it tiles): `.texture-concrete`, used on the home Coaches section, tinted 75% concrete. Secondary text darkens to #3a4145 inside it to keep 4.5:1 over the darkest patches.
- `chalk` (960/1600px): the hero lockout overlay. It loads only when the scroll sequence runs (after page load, never under reduced motion or Save-Data).

If you replace a texture, re-check contrast. The tint strengths in `globals.css` were set from these images' brightest and darkest 5% of pixels.

## Social cards

`npm run og` regenerates the Open Graph cards in `public/og/` from page headlines, `classes.json` and the lowest plan price. Re-run it after changing any of those. Background: `assets/og/background.webp` (any 1:1 or wider image works; the centre band is used).

## Images

Class and trainer images are 3:4 portrait; facility photos (`gym.json` → `gallery`) are 4:3 landscape. The first gallery photo is the large lead image on the home page. `gym.json` → `exterior` (16:9) sits under the address on /contact and is that page's LCP image, so keep it the only photo there (1500×2000 or similar). Card and detail page both crop to 3:4, so they morph cleanly between pages.

1. Put the source photo in `assets/images/` using the same key, e.g.
   `assets/images/trainers/maya-okafor.jpg` (jpg, png, webp or avif).
2. Run `npm run images`. It writes AVIF + WebP at 640/960/1440/1920 (never
   upscaled) to `public/img/` and updates `images.json`.
3. Reference it by key: `"image": "trainers/maya-okafor"`.

`npm run images:placeholders` only fills in keys with no source in any format,
so real photos are never overwritten or duplicated. `npm run images` fails if one
key has two sources (e.g. `engine.jpg` and `engine.webp`).
