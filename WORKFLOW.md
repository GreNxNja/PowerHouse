# WORKFLOW.md — PowerHouse Gym: Fluid Animated Static Site (Next.js)

Drop this in the repo root. Work through the phases in order. Do not start a phase until the previous phase's exit check passes. If you are an AI coding agent, treat this file as the source of truth and tick the checkboxes as you go.

Versions are "latest at time of writing" (Oct 2026). Install with `@latest`, then pin the exact versions that resolve in `package.json`.

**Constraint:** this is a fully static site. It ships as plain HTML/CSS/JS from `out/` with no Node server at runtime. That rules out Server Actions, API routes, ISR, `cookies()`/`headers()`, rewrites/redirects in `next.config`, and the default image optimizer. Everything below is designed around that.

## 1. Stack

| Layer | Choice | Why |
| --- | --- | --- |
| Framework | Next.js 16.x, App Router, `output: "export"` | Static HTML export, Turbopack default |
| UI runtime | React 19.x | View Transitions, `useEffectEvent` |
| Language | TypeScript (`strict: true`) | |
| Styling | Tailwind CSS v4 (CSS-first `@theme`) | Tokens live in CSS |
| Components | shadcn/ui (dialog, sheet, accordion only) | Accessible primitives you own |
| UI animation | Motion (`motion/react`) | Layout animation, shared elements, gestures |
| Scroll animation | GSAP 3 + ScrollTrigger + SplitText + `@gsap/react` | Pinned and scrubbed timelines |
| Smooth scroll | Lenis, synced to the GSAP ticker | The fluid feel |
| Hero visual (pick one) | A) canvas image-sequence scrub, B) React Three Fiber, C) OGL shader | See Phase 3 |
| Forms | react-hook-form + zod, posting to a form endpoint | No server of our own, see Phase 5 |
| Content | MDX / typed JSON in repo, zod-validated at build | No CMS needed for a static site |
| Images | Pre-optimized at build with sharp script (AVIF/WebP, multiple widths) | `next/image` optimizer is unavailable in export |
| Tooling | npm, Biome, Vitest, Playwright, Lighthouse CI | `next lint` was removed in Next 16 |
| Hosting | Cloudflare Pages (default), or Netlify, Vercel, or S3 + CloudFront | Any static host works |

Not needed (dropped because static): Postgres/Drizzle, Stripe, Server Actions, Cache Components/PPR, Docker.

## 2. Design direction

- **Gym:** PowerHouse
- **Primary job of the site:** get a visitor to book a free trial session
- **Still to confirm:** location, gym type (strength / CrossFit / mixed), logo and brand colors if they exist

Avoid the defaults. Black background + neon green + all-caps condensed type is what every gym template looks like. The name PowerHouse suggests weight, mass, and a building. Lean on that: raw concrete, plate iron, chalk, heavy type. Proposed starting tokens (edit freely):

```css
/* src/app/globals.css */
@import "tailwindcss";

@theme {
  --color-concrete: #c9cccb;
  --color-chalk:    #f3f5f4;
  --color-iron:     #1d2225;
  --color-rubber:   #2c3236;
  --color-ultra:    #3b2bff;   /* single accent, CTAs only */

  --font-display: "Your Display Face", system-ui, sans-serif;
  --font-body:    "Your Body Face", system-ui, sans-serif;

  --ease-fluid: cubic-bezier(0.22, 1, 0.36, 1);
}
```

Rules:

- One signature moment. Spend the motion budget on the hero scroll sequence. Everything else stays quiet.
- Motion that answers a user action (menu, filter, expand) is always welcome. Non-triggered motion is limited to the hero and one other reveal.
- No fade-up on every section, no hover lift on every card.
- Two typefaces max, clearly distinct, loaded with `next/font`.
- Sentence-case labels. CTAs say what happens ("Book a free session", not "Submit").
- Body line length under 80 characters.

## 3. Phases

### Phase 0 — Scaffold

- [x] `npx create-next-app@latest powerhouse --ts --tailwind --app --turbopack --src-dir --import-alias "@/*" --use-npm --biome --react-compiler`
  - Scaffolded in a temp dir and copied into the repo root, because npm package names can't contain capitals (`BulkBuster`). Package name is `powerhouse`.
- [x] `npm install motion gsap @gsap/react lenis zod react-hook-form @hookform/resolvers`
- [x] `npx shadcn@latest init`, then add `dialog sheet accordion`
- [x] `npm install -D @biomejs/biome vitest @playwright/test @lhci/cli sharp`
- [x] `next.config.ts`:

```ts
import type { NextConfig } from "next";

const config: NextConfig = {
  output: "export",             // static HTML into /out
  trailingSlash: true,          // friendlier on S3 / plain static hosts
  images: { unoptimized: true },// optimizer needs a server; we pre-optimize instead
  reactCompiler: true,          // needs babel-plugin-react-compiler
};
export default config;
```

  - The template's `cacheComponents` and `partialPrefetching` flags were removed (not compatible with this static setup). Its Turbopack rule for `@tailwindcss/turbopack` was kept.
- [x] `.nvmrc` pinned to current Node LTS (24), `.env.example`, `git init`
- [x] Exact versions pinned in `package.json`

**Exit check:** `npm run dev` runs, `npm run build` produces `out/`, Biome clean. ✅ Passed 2026-10-07.

Notes:

- `npm run typecheck` runs `next typegen && tsc --noEmit`. The typegen step is needed on a clean checkout because `LayoutProps`/`PageProps` are generated globals.
- `npm audit` reports advisories in transitive dev-only dependencies of `@lhci/cli` (tmp, uuid, inquirer). They don't ship in `out/`. Recheck when `@lhci/cli` updates.

### Phase 1 — Foundation

- [x] Design tokens in `globals.css`
- [x] Fonts via `next/font` (self-hosted, subset, `display: swap`)
- [x] Layout shell: header, footer, skip link, `<main id="main">`
- [x] Motion provider mounting Lenis once and wiring it to GSAP:

```tsx
// src/components/motion-provider.tsx
"use client";
import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function MotionProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);

    const tick = (t: number) => lenis.raf(t * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
```

- [x] Page transitions: React `<ViewTransition>`, Motion `layoutId` for shared elements

**Exit check:** smooth scroll works, reduced motion falls back to native scroll, no layout shift. ✅ Passed 2026-10-07 (Playwright in Edge, desktop and 390px mobile).

- Smooth scroll: a 500px wheel step eases over ~1s (92 → 389 → 500px). Reduced motion: no Lenis, native jump to 500px in one frame.
- Toggling the OS reduced-motion setting while the page is open switches Lenis off and back on without a reload.
- CLS: 0 in both modes. No console errors. No horizontal scroll at 390px.
- Skip link is the first tab stop and moves focus to `#main`.
- Mobile menu: focus moves into the sheet, Escape closes it and returns focus to the trigger, Lenis pauses while it's open.

Decisions and notes:

- **Fonts (provisional, swap freely):** Archivo for display, using its width axis at 125% (wide and heavy, "mass", not the condensed gym cliché). IBM Plex Sans for body, weights 400/500/600.
- **Tokens:** brand colors live in `@theme`. shadcn's semantic variables (`--primary`, `--border`, …) are mapped onto them in `:root`, so dialog/sheet/accordion match without edits. Radius is 2px. Added `--color-slate` (#4f575b) for secondary text, and `--input` (#767d80) so form borders meet 3:1.
- **Contrast:** every pair passes AA except ultra on iron (2.3:1). Dark sections use the `.surface-iron` class, which switches the focus ring to chalk. Don't put ultra text or rings on iron.
- **Motion provider** (`src/components/motion-provider.tsx`) differs from the snippet above: it follows live changes to reduced motion, restores GSAP lag smoothing when Lenis is off, wraps the app in Motion's `<MotionConfig reducedMotion="user">`, and exposes Lenis through `useLenis()` so overlays can `stop()`/`start()` it.
- **GSAP:** import from `@/lib/gsap`, which registers `useGSAP` and `ScrollTrigger` once.
- **Page transitions:** wrap each `page.tsx` in `<PageTransition>`, not the layout (layouts persist, so enter/exit never fire there). Links pass `transitionTypes` from `navTransition` in `@/lib/animations`: `lateral` (crossfade, main nav), `forward`/`back` (48px slide, detail pages). The header is pinned with `viewTransitionName: "site-header"`. Untyped navigations (browser back) don't animate. All of it is off under reduced motion. Verified in Phase 2: forward, back and lateral navigations each start a view transition.
- **Shared elements:** use `<ViewTransition name>` across routes (class card → detail). Motion `layoutId` only works inside one mounted tree, so keep it for same-page cases like the filter reorder.
- The mobile menu is a plain shadcn Sheet for now. Phase 4 adds the stagger.
- Site name, nav and CTA live in `src/lib/site.ts`.

### Phase 2 — Content and routes

All routes are prerendered at build time.

| Route | Purpose |
| --- | --- |
| `/` | Hero, classes preview, trainers, pricing teaser, trial CTA |
| `/classes` | Class list with client-side filter chips |
| `/classes/[slug]` | Class detail, needs `generateStaticParams` (required in export) |
| `/trainers` | Trainer profiles |
| `/membership` | Plans and comparison |
| `/timetable` | Weekly timetable from a JSON file (static, updated by redeploy) |
| `/contact` | Address, hours, map embed, trial form |

- [x] Content in `src/content` as typed JSON, validated with zod during build
- [x] Real or realistic copy, no lorem ipsum
- [x] Image pipeline: `scripts/optimize-images.ts` (sharp) outputs AVIF + WebP at 640/960/1440/1920 into `public/img`, and a small `<Picture>` component renders `srcset`

**Exit check:** every route builds and renders with real content. ✅ Passed 2026-10-07 with realistic placeholder content (see below).

- `npm run build` prerenders 17 pages: 6 top-level routes, 8 class detail pages and the 404. `dynamicParams = false` on `/classes/[slug]`, so unknown slugs 404.
- Checked in Playwright (Edge) at 1366px and 390px: every route returns 200 with one `<h1>`, no console errors, no broken images, no horizontal scroll, CLS 0. An unknown URL returns 404 with the custom page.
- Class filter works (8 → 2 for Conditioning) and sets `aria-pressed`. FAQ accordion opens. Page transitions fire.
- A deliberately broken timetable entry fails the build with `Content error: monday 07:30: tom-becker is not listed as a coach for engine`.
- No zod or content copy in the client JS chunks: the class filter receives server-rendered cards as props.

Notes:

- **Content is placeholder.** `src/content/gym.json` has `"placeholder": true`. The address, hours, prices (USD), classes, trainers and timetable are all invented. The phone uses the fictional 555-01xx range, and the email uses an `.example` domain, so nothing real gets called if it ships by mistake. `src/content/README.md` lists everything to confirm.
- **Content format:** JSON only, no MDX. Nothing needed rich text. Add `@next/mdx` if long-form pages arrive.
- **Cross-checks** in `src/content/index.ts` catch: unknown class or coach slugs, a trainer not listed for the class, a session length that doesn't match the class, sessions outside opening hours, double-booked trainers, missing images, and incomplete comparison rows.
- **Images:** sources live in `assets/images/<key>.jpg`. `npm run images` writes AVIF + WebP to `public/img/` and the size manifest to `src/content/images.json`. Both outputs are committed, so CI doesn't need to run sharp. Widths never upscale. `npm run images:placeholders` generates labelled stand-ins for missing files and never overwrites real ones. Scripts run with Node's built-in TypeScript support; `scripts/package.json` marks that folder as ESM.
- **`<Picture>`** takes width and height from the manifest, so images never shift layout. Only the LCP image per page gets `priority` (eager, `fetchpriority="high"`). Everything else is lazy.
- **Contact:** the map only renders once `gym.geo` is set. The `#trial` section points to phone and WhatsApp until Phase 5 adds the form.
- **Left for Phase 4:** filter reorder animation, class card → detail shared-element transition, pricing toggle (both prices are shown for now), trainer expand-in-place.
- **CSS gotcha:** a scroll container with `sr-only` children needs `position: relative`, or the absolutely positioned labels escape the clip and widen the page. The comparison table hit this.

### Phase 3 — Signature animation (the hero)

Pick one and commit. **Chosen: A, canvas image-sequence scrub** (placeholder frames for now).

**A. Canvas image-sequence scrub** (recommended; best fluid feel per KB, fully static-friendly)

- Export 90–150 frames of a lift or movement (WebP, ~1600px wide) into `public/frames/`.
- Draw frames to a `<canvas>`, driven by a pinned ScrollTrigger with `scrub: 0.5`.
- Preload the first ~10 frames, stream the rest.

```tsx
useGSAP(() => {
  const state = { frame: 0 };
  gsap.to(state, {
    frame: FRAME_COUNT - 1,
    snap: "frame",
    ease: "none",
    scrollTrigger: { trigger: heroRef.current, start: "top top", end: "+=300%", scrub: 0.5, pin: true },
    onUpdate: () => render(state.frame),
  });
}, { scope: heroRef });
```

**B. React Three Fiber:** lightweight 3D scene (plates, kettlebell, or abstract shape) with a scroll-linked camera. Load with `next/dynamic` and `ssr: false`. Cap `dpr` at 1.5.

**C. WebGL shader:** liquid/ink displacement over the hero image, pointer-reactive. Use OGL, not full three.js.

Rules for all three:

- Hero text is real DOM text (SEO + a11y), animated with SplitText.
- Static poster fallback for reduced motion and low-power devices.
- The poster image is the LCP element. Never block LCP on the animation.

**Exit check:** hero holds 60fps on a mid-range phone profile (Chrome DevTools, 4x CPU throttle). ✅ Passed 2026-10-07 with placeholder frames.

Results (Playwright in Edge against the static export in `out/`):

- **Perf:** at 390px, DPR 2, 4x CPU throttle, scrolling through the whole pin over 4 seconds: average 60 fps, p95 frame 16.9 ms, worst 17.2 ms, 0 frames over 20 ms. This was headless; confirm on a real mid-range phone once real frames exist, since photo frames decode heavier than the placeholders.
- **Scrub:** pinned for 300% of viewport height, below the sticky header. Frames 1 → 47 → 115 at 0% / 40% / 98% of the pin. The headline words lift away, "Every rep, coached." arrives at about 62%, and the CTAs stay visible throughout.
- **Reduced motion and Save-Data:** no pin, no canvas, 0 frame requests, static poster and text. The closing line stays hidden.
- **Navigation:** leaving home removes the pin, coming back rebuilds it, page height is identical. No console errors.
- **LCP:** on phones the poster is the LCP element (`poster-640.avif`, 176 ms). On desktop Chrome reports the `<h1>` instead, because the placeholder poster is under Chrome's 0.05 bits-per-pixel cutoff for low-detail images. A real photo will be well above it. Recheck when real images land.

How it's built (`src/components/hero/`):

- `hero.tsx` (server) renders the poster, scrim, `<h1>`, lede, closing line and CTAs as real DOM text. `hero-scroller.tsx` (client) adds the canvas and the GSAP timeline.
- **One timeline, one ScrollTrigger:** frames (`snap: "frame"`), SplitText word exits, and the closing line. It's set up inside `gsap.matchMedia("(prefers-reduced-motion: no-preference)")`, so it reverts if the setting changes live.
- **Loading:** frames start only after `load`, on idle. The first 10 load in parallel, then the rest with concurrency 4. Until a frame arrives, the nearest decoded one is drawn. The canvas stays transparent until frame 1 is drawn, and frame 1 equals the poster, so the handoff is invisible.
- **Frame size** by canvas width × DPR (DPR capped at 1.5): 800px frames on phones, 1600px above 900 device px. Placeholder totals: 528 KB (800) and about 1 MB (1600) for 120 frames.
- **Low power** (`isLowPower()`): Save-Data, 2G/3G, or `deviceMemory` < 2 skips the sequence.
- SplitText is registered in the hero module only, so it ships in the home page chunk, not the shared bundle.

- **Chalk overlay (added 2026-10-07):** `public/img/textures/chalk-*.webp` is screened over the hero from about 58% of the pin (opacity 0 → 0.5, scale 1.12 → 1, x −6% → 0), masked off the bottom 45% so it never sits behind the closing line or CTAs. It's part of the same timeline and the same reduced-motion and low-power gate, and `src` is only set when the sequence starts. Re-measured: still 60 fps average, p95 16.8 ms and 0 frames over 20 ms at 4x CPU throttle.

**Real footage (2026-10-07):** `npm run frames -- "<video>"` (`scripts/hero-frames.ts`). It decodes the clip in Edge via Playwright, so no ffmpeg is needed.

- **Source:** `hero vid.mp4`: 10 s, 24 fps, 1280×720. It's a loop: 0–20 lockout hold, 20–80 lowering, 80–180 setup, 180–220 pull, 220–239 drop.
- **Frames used (revised):** source frames 59 → 0, reversed: 60 frames. The first cut (90 → 0) looked like the lifter **bounced the bar** on full screens, because the AI clip has the bar touch the floor at frame 59, rebound ~40px (to frame 75) and land again (frame 90). Bar height tracked per source frame (plate centroid, bigger y = lower): 0–21 hold ≈428, lowering to 548 at 59–60, rebound to 509 at 75, 553 at 90, setup until 168, clean pull 168–211 (555→444), drop after 211. The extracted 60 frames rise monotonically (555 → 429; largest downward step 0.8px, which is noise).
- **Frame blending:** 60 frames is under Section 3's 90, so the canvas draws fractional positions as a crossfade of the two nearest frames (8 steps per frame) instead of snapping. Verified at 1920×1080 over 41 scroll positions: the bar never moves down in the rendered canvas.
- **Crop:** cropped to 1110×720 to drop the generator watermark (bottom-right of every frame). Sizes 640 and 1110, never upscaled. WebP q66, three sizes (640 / 800 / 1110): 1.2 / 1.6 / 2.2 MB for the 60-frame set, streamed after load.
- **Poster:** frame 1 → `assets/images/hero/poster.jpg` → `npm run images`.
- **Hero component:** picks the smallest frame set that covers the canvas, from `frames.json` sizes (no hard-coded widths).
- **Re-verified:** the poster is now the LCP on desktop too (`poster-1110`, 460 ms) and on mobile (`poster-960`, 212 ms), which resolves the Phase 3 LCP caveat. 60 fps average, p95 16.8 ms, 0 frames over 20 ms at 4x throttle. Reduced motion: 0 frame requests.
- **Limitation:** 720p source means the poster and frames are upscaled on screens wider than about 1110 device px. 1080p or 4K footage of the same move would fix it: update `CROP`, `SIZES` and `RANGE` in the script and re-run.
- **Phone layout (2026-10-07):** on portrait phones (Tailwind `max-sm:portrait:`) the footage is a band across the top showing 80% of the frame width, with the text below it on iron. Before this, the full-screen cover showed only the middle third of the frame: the lifter was cut off and the text sat on top of him. On short phones (`short-portrait` variant: portrait, height under 700px) the headline and spacing tighten. Measured overlap of headline over band: 360×640 29px and 375×667 14px, both inside the band's fade; taller phones 0px.
- **Focal points** (`frames.json` → `position`): band 0.925, cover 0.68, so the lifter (~0.40–0.77 of the frame) stays in shot in both modes. The poster uses the same values through CSS variables, and the canvas through `BAND_QUERY`. Handoff check (screenshot with the canvas visible vs hidden): mean difference 0.8–2.3 grey levels at 390, 768, 1024 and 1366 wide, i.e. aligned.
- **Frame size choice** now uses the drawn width (cover zoom × DPR), not the canvas width. That was why phones looked soft: they drew about 200 source px across the screen. Frame sets are 640 / 800 / 1110 with a DPR cap of 1.5. Phones get 800px frames at 60 fps (p95 16.8 ms) at 4x throttle. DPR 2 with 1110px frames dropped to 54 fps on phones because 91 decoded 1110px frames (~290 MB) exceed the browser's decode cache.
- **Phase 6 follow-up:** on desktop (1920×1080) at 4x throttle, the first scroll through the pin runs at 56.5 fps while 1110px frames decode on first draw (it was 45 with 91 frames). The second pass is 60; phones are 60 both ways. Consider pre-decoding with `createImageBitmap` sized to the canvas.
- **Header:** the desktop nav now starts at `lg` (1024px); below that it's the menu button plus the CTA. At 768px the CTA used to wrap onto three lines. CTAs are now `whitespace-nowrap`.
- `scripts/placeholder-frames.ts` was removed. It deleted `public/frames/` on every run, which would wipe the real frames.

### Phase 4 — Interactive components (user-triggered motion)

- [x] Mobile nav sheet with staggered links (Motion)
- [x] Class filter chips with layout animation as cards reorder
- [x] Class card to detail shared-element transition
- [x] Pricing toggle (monthly/annual) with animated number change
- [x] Trainer card expand-in-place
- [x] Magnetic CTA (pointer devices only, off for reduced motion)

**Exit check:** all keyboard-operable, focus visible and managed. ✅ Passed 2026-10-07.

Results (Playwright in Edge against `out/`, keyboard only):

- **Mobile menu:** Tab to "Open menu" and press Enter. Focus moves into the sheet, links stagger in (opacities 0.37 / 0.07 / 0 at 80 ms, all 1 by 900 ms), Tab wraps Close → first link without leaving the dialog, and Escape returns focus to the trigger.
- **Filter:** Space on a chip sets `aria-pressed`, the live region says "Showing 2 classes", and moving cards use transforms only (`translate3d` / `scale`).
- **Card → detail:** when the transition starts, `class-engine` is named on both the old and new page, so the image morphs. It runs inside the `nav-forward` slide.
- **Pricing:** arrow keys switch the native radios. Prices count ($59 → $51 → $49) while the screen-reader copy is already final ($49). The billing line switches between "Billed monthly…" and "$588 billed once a year."
- **Trainers:** Enter on "Read Daniel Reyes's profile" expands the card to full width (1232px) using layout transforms. Focus stays on the toggle, which now reads "Close profile". Collapsed panels use `hidden="until-found"`, and a `beforematch` event opens the card. `/trainers/#priya-nair` opens Priya and scrolls her card to 96px from the top after the expand settles.
- **Magnetic CTA:** pulls up to 10px with a mouse. No transform under reduced motion or on touch.
- **Focus rings:** tabbed through `/`, `/classes/`, `/membership/`, `/trainers/`, a class page and `/contact/` (18 to 27 stops each). Every stop shows the outline. No console errors.

Notes:

- **Shared element** (`src/components/content/class-image.tsx`): `<ViewTransition name="class-<slug>" share="morph" default="none">` around the image on both the card and the detail page. The morph CSS is `.morph` in `globals.css` (420 ms, slight mid-flight blur). Motion `layoutId` can't do this across routes, so it's only used for the billing toggle's pill.
- **Filter:** `AnimatePresence mode="popLayout"` + `layout="position"`. Leaving cards are popped out of flow so the rest move at once. The `ul` must stay `relative` for popLayout.
- **Pricing** (`plan-pricing.tsx`): a client component. Plans are small plain data, and `formatPrice` has no content import, so zod still stays server-side. The animated number is `aria-hidden`, with an `sr-only` final value beside it.
- **Trainer grid** (`trainer-grid.tsx`): React only supports a boolean `hidden`, so an effect upgrades collapsed panels to `until-found` after each render. Scrolling to an expanded card waits for the layout animation (immediate under reduced motion), otherwise it lands where the card used to be. Expanded layout is a third portrait, two-thirds profile, so Close stays on screen.
- **Magnetic** (`src/components/magnetic.tsx`): used on the hero CTA and the home page "How your free session works" CTA only. Header and footer CTAs stay still.
- **Focus styling:** removed `outline-none` and the 50%-opacity ring from shadcn `button.tsx` and `accordion.tsx` so they use the site-wide `:focus-visible` outline. Don't reintroduce `outline-none` on interactive elements.
- **Reduced motion:** `MotionConfig reducedMotion="user"` drops transforms (slides, layout moves) and keeps short fades. Number counting and the magnetic pull are off. View transitions are off via CSS.

### Phase 5 — Conversion (no backend)

A static site can't receive form posts itself, so pick one endpoint:

- **Web3Forms / Formspree / Basin** (fastest, free tiers): `fetch` POST from the client, emails the gym.
- **AWS API Gateway + Lambda + SES** (if you want it on your own AWS): one small Lambda, CORS locked to the site origin.
- **WhatsApp / tel link** CTA alongside the form, since many gym leads prefer it.

Checklist:

**Chosen: Web3Forms** (2026-10-07), with WhatsApp and phone links alongside.

- [x] react-hook-form + zod validation on the client
- [~] Honeypot field + Cloudflare Turnstile. **Honeypot only for now.** Turnstile is a paid Pro feature on Web3Forms. Free hCaptcha exists, but Web3Forms' own docs say it's hard to solve, which would cost bookings. See "Turning on a captcha" below.
- [x] Success and error states say what happened and what to do next
- [x] Privacy note on the form, analytics via Plausible (cookieless). Chosen over Cloudflare Web Analytics because that has no custom events.
- [x] Track events: trial form start, submit, click-to-call

**Status:** done, apart from Turnstile (above). Verified 2026-10-07 in Playwright (Edge) against `out/`, built with a dummy key, with Web3Forms and Plausible intercepted so nothing real was sent:

- **Empty submit:** focus moves to "Your name"; inline messages for name, email, time and experience; `aria-invalid` set and messages linked with `aria-describedby`; 0 requests sent.
- **Bad email or phone:** specific messages ("It should look like name@example.com", "Check your phone number, or leave it blank").
- **Keyboard only:** Tab, type, Space and arrow keys on the radio chips, Enter on submit. The honeypot is skipped. The payload carries readable labels ("Evening, after 5 PM"), `botcheck: false` and the subject "Free session request: Sam Rivera". On success, focus moves to "Thanks, Sam. Your request is in."
- **429 / 400 / network failure:** each shows its own `role="alert"` message, keeps what was typed, re-enables the button and offers phone and WhatsApp.
- **No access key** (how it ships until you add one): "Online booking isn't switched on yet" plus phone and WhatsApp; 0 requests; Plausible not loaded.
- **Events:** "Trial form start" (first focus), "Trial form submit" {experience, time}, "Trial form error" {reason}, "Click to call" / "WhatsApp click" {page}. The click events come from one delegated listener in `src/components/analytics.tsx`, so links stay in Server Components.
- **Mobile (390px):** no horizontal overflow; radio chips 44px tall.

Setup for launch:

1. Create a Web3Forms access key for the gym's inbox at https://web3forms.com and set `NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY` at build time. It's public by design.
2. Optional: set `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` (and `NEXT_PUBLIC_PLAUSIBLE_SRC` if Plausible gives you a per-site script URL), then add the five goals above in Plausible.

Turning on a captcha if spam arrives:

- **hCaptcha (free):** enable it in the Web3Forms dashboard, add `@hcaptcha/react-hcaptcha` with the shared site key from their docs, and send its token as `h-captcha-response`.
- **Turnstile:** needs Web3Forms Pro.

Files: `src/lib/trial-form.ts` (schema, options, payload; kept out of `schemas.ts` so the client bundle doesn't pull in the content schemas), `src/components/content/trial-form.tsx`, `src/lib/analytics.ts`, `src/components/analytics.tsx`. On dark surfaces `--destructive` is #ff9e8f (8:1 on iron), because the brand red is only 2.4:1 there.

> **Phase 6 warning, measured now:** first-load JS is about 310 KB gzipped on every page (home 313, classes 309, membership 318, contact 349), against a 170 KB budget. The form adds about 36 KB on /contact only, so most of the overage is the shared baseline (GSAP, ScrollTrigger, Motion, Lenis on every route). Lazy-loading those where used is already a Phase 6 item and now the top priority there.

### Addendum — Evening theme (2026-10-07)

The gym after dark with the lights on: dusk-blue black (#111518), tungsten-white text (#f3ede4) and warm grey secondary text (#b3ab9e). The single accent switches from ultra to amber lamplight (#ffb547), used for CTAs and focus rings only. Touches that make it feel lit:

- CTAs glow (static box-shadow, `data-cta`).
- Faint amber and dusk-blue light at the top of the page.
- The concrete section becomes the same wall at night.
- The highlighted plan gets an amber outline.
- The booking form gets dark fields.

**How it works:**

- `.dark` on `<html>` re-points the semantic tokens (`--background`, `--foreground`, `--card`, `--muted`, `--primary`, `--ring`, `--color-slate` …) in `globals.css`. It also drives shadcn's `dark:` variants.
- Page-context colours moved from brand utilities to semantic ones (`bg-background`, `text-foreground`, `bg-card`, `border-foreground`, `bg-primary`). Always-dark surfaces (hero, footer, `.surface-iron` blocks, skip link) keep fixed iron and chalk. **Rule from now on:** use semantic tokens for anything on the page background, and brand colours only on fixed-dark surfaces.
- **Default and persistence:** follows `prefers-color-scheme`. The header toggle (sun/moon, `aria-pressed`) stores "evening" or "day" in `localStorage` and then ignores system changes; with no stored choice, system changes are followed live. `src/lib/theme.ts` holds the head script that sets the class before first paint (no flash) and `applyTheme()`, which also syncs `<meta name="theme-color">`.
- **Switching:** a 450 ms view-transition crossfade of the whole page, header included. Instant under reduced motion or without view-transition support.

**Verified (Playwright, Edge, `out/`):**

- First paint is already evening with a dark system and no stored choice.
- Toggle, persistence across reload and live system following all behave as described above.
- Keyboard: Tab to the toggle, Space switches.
- Contrast audit of every visible text element on 7 routes in both themes (text over photos and video excluded): 0 real failures. One flagged item, the selected "Monthly" pricing chip, is a false positive: the pill is a sibling behind the label, and it renders light text on dark by day and dark on light in the evening.
- Computed evening pairs: text 15.8:1, secondary 6.1–8.1:1 on every surface, iron on amber 9.1:1, amber vs page 10.5:1, form borders 3.7–4.3:1.

**Currency → INR (2026-10-07):** `gym.json` is now `locale: "en-IN"`, `currency: "INR"`. Prices, times, dates and `og:locale` (`en_IN`) all follow from it: ₹2,500, "5:30 am", "7 October 2026", Indian grouping (₹1,50,000). Placeholder prices are ₹2,500 / ₹6,000 / ₹8,500 monthly and ₹2,000 / ₹5,000 / ₹7,000 a month annually ("save up to 20%"), plus ₹500 drop-in. OG cards regenerated. The address and phone are still US-style placeholders.
**Phase 6 note:** Archivo's ₹ is in its latin-ext file and IBM Plex Sans has no ₹ in any Google subset (body text falls back to the system font for that glyph). Pages that show prices in the display font download about 109 KB of extra fonts. Consider a custom subset (Latin + ₹).

**Windows export bug, worked around (found during this check):** Next 16's exporter writes nested segment prefetch files as folders on Windows (`out/classes/__next.classes/__PAGE__.txt`) because it only converts `/` to `.` in `convertSegmentPathToStaticExportFilename`, while the client requests `out/classes/__next.classes.__PAGE__.txt`. Every prefetch 404'd on Windows builds (Linux builds are correct). `scripts/fix-export-prefetch.ts` runs as `postbuild` and flattens those folders; it finds nothing to do on Linux. Worth reporting upstream.

### Phase 6 — Performance, a11y, SEO

Budgets (fail CI if broken):

| Metric | Target |
| --- | --- |
| LCP | < 2.0s (mobile 4G) |
| INP | < 200ms |
| CLS | < 0.05 |
| JS on first load | < 170 KB gz, excluding the hero chunk |
| Lighthouse (Perf / A11y / SEO / Best Practices) | >= 95 / 100 / 100 / 100 |

- [ ] Lazy-load GSAP plugins and any 3D code only where used
- [ ] Only the LCP image is eager and high priority; everything else lazy
- [ ] `prefers-reduced-motion` respected in JS and CSS
- [ ] AA contrast minimum, visible focus rings, semantic landmarks
- [ ] `sitemap.ts` and `robots.ts` with `export const dynamic = "force-static"`
- [ ] JSON-LD `HealthClub` / `LocalBusiness` (address, hours, geo)
- [ ] Per-route metadata and canonical URLs; OG images as static files in `public/og/`
  - **OG cards done early (2026-10-07):** `npm run og` (`scripts/og-images.ts`) renders 14 cards at 1200×630, about 60 KB each, into `public/og/`: one per top-level route and one per class. Background: `assets/og/background.webp`, centre band. Type: Archivo Expanded Black and Archivo, from `assets/fonts/archivo-latin-variable.ttf`. That file is converted from next/font's WOFF2 because Pango can't read WOFF2; it's OFL-licensed, see the README there. `src/lib/seo.ts` → `pageMetadata()` sets the full `openGraph` + `twitter` block per page, because Next replaces `openGraph` wholesale rather than merging it. Verified: every exported route, 404 included, points to an image that exists.
  - **Card text duplicates each page's `<h1>`:** the script lists it by hand, except class cards, which come from `classes.json`. Re-run `npm run og` after changing headlines, class names or prices.
  - **Must set before deploy:** `NEXT_PUBLIC_SITE_URL` at build time. OG URLs are absolute and currently resolve to `http://localhost:3000`.
  - **Still to do in Phase 6:** canonical URLs.
- [ ] Redirects and cache headers set at the host (`_redirects` / `_headers`), not in `next.config`

### Phase 7 — Testing and CI

- [ ] Vitest for schemas and utilities
- [ ] Playwright against the exported `out/` folder: nav, filter, form validation, reduced-motion run
- [ ] Lighthouse CI against `out/`

```yaml
# .github/workflows/ci.yml
name: CI
on:
  pull_request:
  push:
    branches: [main]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: npm
      - run: npm ci
      - run: npx biome ci .
      - run: npm run typecheck
      - run: npx vitest run
      - run: npm run build            # outputs ./out
      - run: npx playwright install --with-deps chromium
      - run: npx playwright test
      - run: npx lhci autorun
```

### Phase 8 — Deploy

**Cloudflare Pages (default):** connect the repo, build command `npm run build`, output directory `out`, preview deploy per PR, attach domain.

Alternatives: Netlify or Vercel (same build and output settings), or S3 + CloudFront (sync `out/` to the bucket, long cache on `/_next/static`, short cache on HTML, invalidate on deploy).

- [ ] Custom domain + HTTPS
- [ ] Immutable caching for hashed assets, short caching for HTML
- [ ] Uptime check, and Sentry only if you want client error reports

## 4. Project structure

```
src/
  app/
    page.tsx
    classes/page.tsx
    classes/[slug]/page.tsx
    trainers/page.tsx
    membership/page.tsx
    timetable/page.tsx
    contact/page.tsx
    globals.css
    layout.tsx
    sitemap.ts
    robots.ts
  components/
    ui/                  # shadcn primitives
    hero/                # signature animation, isolated
    motion-provider.tsx
    picture.tsx
  content/               # MDX / JSON, zod-validated
  lib/
    animations.ts        # shared easing, durations, variants
    schemas.ts           # zod schemas
scripts/
  optimize-images.ts     # sharp pipeline
public/
  img/  frames/  og/
```

## 5. Rules for the coding agent

- Server Components by default (they render at build time). `"use client"` only for animation, forms, and interactive leaves.
- Never add anything that needs a runtime server: no Server Actions, route handlers that read the request, `cookies()`, `headers()`, ISR, or middleware/proxy.
- Every dynamic route must export `generateStaticParams`.
- Register GSAP plugins once and animate with `useGSAP`, never raw `useEffect` plus manual tweens.
- Animate `transform` and `opacity` only.
- Every animation has a reduced-motion path.
- No new dependency without a one-line reason in the PR description.
- No `any`. Validate content and form input with zod.
- Before calling a phase done: `npx biome check`, `npm run typecheck`, `npm run build`.
- No decorative motion beyond Section 2's rules. Ask first.
