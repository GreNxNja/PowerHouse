"use client";

import { SplitText } from "gsap/SplitText";
import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { drawCover, FrameSequence, isLowPower } from "./frame-sequence";
import frames from "./frames.json";

// Only the hero uses SplitText, so it is registered here and stays in this chunk.
gsap.registerPlugin(SplitText);

const DPR_CAP = 1.5; // 2 re-decodes frames on phones (91 × 1110px exceeds decode cache)
/** Portrait phones show the footage as a band this share of the frame wide. */
export const BAND_VISIBLE = 0.8;
/** Must match Tailwind `max-sm:portrait:` used for the band and poster position. */
const BAND_QUERY = "(width < 40rem) and (orientation: portrait)";
const PIN_LENGTH = "+=300%";

const frameUrl = (size: number, i: number) =>
  `/frames/${size}/frame-${String(i + 1).padStart(4, "0")}.webp`;

/**
 * The signature moment: a pinned, scroll-scrubbed image sequence drawn to a
 * canvas over the poster. The poster (server-rendered, LCP) is always there
 * underneath; the canvas only appears once frame 1 is decoded, and frame 1
 * matches the poster, so the handoff is invisible.
 *
 * Off entirely for reduced motion and low-power devices: poster and static text.
 */
export function HeroScroller({
  poster,
  children,
  labelledBy,
}: {
  poster: React.ReactNode;
  children: React.ReactNode;
  labelledBy: string;
}) {
  const root = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chalkRef = useRef<HTMLImageElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const section = root.current;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!section || !canvas || !ctx || isLowPower()) return;

        // ---- Canvas ----
        const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
        // Smallest frame set that covers the canvas; the largest if none does.
        // Pick by the width the frame is actually drawn at: cover-cropping
        // zooms in, so the canvas width alone under-asks.
        const coverScale = Math.max(
          canvas.clientWidth / frames.width,
          canvas.clientHeight / frames.height,
        );
        const needed = frames.width * coverScale * dpr;
        const size =
          frames.sizes.find((s) => s >= needed) ??
          frames.sizes[frames.sizes.length - 1];
        const large = canvas.clientWidth * dpr > 900;
        const state = { frame: 0 };
        let drawnKey = "";
        let revealed = false;
        // Blend steps per frame. 8 is visually continuous and skips redundant draws.
        const BLEND_STEPS = 8;

        /**
         * Draws the frame at a fractional position: the frame below, then the
         * next one on top at the fractional opacity. Each step of this slow lift
         * is a small movement, so the crossfade reads as motion and the scrub
         * stays smooth with ~60 frames. Falls back to the nearest loaded frame.
         */
        const draw = (force = false) => {
          const pos = Math.min(Math.max(state.frame, 0), frames.count - 1);
          const i0 = Math.floor(pos);
          const t = Math.round((pos - i0) * BLEND_STEPS) / BLEND_STEPS;
          const base = sequence.frames[i0] ?? sequence.nearest(i0);
          if (!base) return;
          const next = t > 0 ? sequence.frames[i0 + 1] : undefined;
          const key = `${base.src}|${next ? t : 0}`;
          if (!force && key === drawnKey) return;
          const posX = window.matchMedia(BAND_QUERY).matches
            ? frames.position.band
            : frames.position.cover;
          drawCover(ctx, base, canvas.width, canvas.height, posX);
          if (next) {
            ctx.globalAlpha = t;
            drawCover(ctx, next, canvas.width, canvas.height, posX);
            ctx.globalAlpha = 1;
          }
          drawnKey = key;
          if (!revealed) {
            revealed = true;
            gsap.set(canvas, { opacity: 1 });
          }
        };

        const sequence = new FrameSequence({
          count: frames.count,
          url: (i) => frameUrl(size, i),
          // Redraw when a frame closer to the scroll position arrives.
          onFrame: (i) => {
            const i0 = Math.floor(state.frame);
            if (i === i0 || i === i0 + 1 || !sequence.frames[i0]) draw();
          },
        });

        const resize = () => {
          canvas.width = Math.round(canvas.clientWidth * dpr);
          canvas.height = Math.round(canvas.clientHeight * dpr);
          draw(true);
        };
        const observer = new ResizeObserver(resize);
        observer.observe(canvas);

        // Never compete with LCP: start fetching frames after load, when idle.
        const idle =
          window.requestIdleCallback ??
          ((cb: () => void) => window.setTimeout(cb, 200));
        // The chalk overlay only exists for the animated version, so it loads then too.
        const chalk = chalkRef.current;
        const start = () =>
          idle(() => {
            void sequence.load();
            if (chalk)
              chalk.src = `/img/textures/chalk-${large ? 1600 : 960}.webp`;
          });
        if (document.readyState === "complete") start();
        else window.addEventListener("load", start, { once: true });

        // ---- Text ----
        const title = SplitText.create("[data-hero-title]", {
          type: "words",
          wordsClass: "inline-block will-change-transform",
        });
        const outro = SplitText.create("[data-hero-outro]", {
          type: "words",
          wordsClass: "inline-block will-change-transform",
        });
        gsap.set("[data-hero-outro]", { autoAlpha: 1 });
        gsap.set(outro.words, { yPercent: 60, opacity: 0 });

        // ---- Scroll ----
        const header = document.querySelector<HTMLElement>("header");
        gsap
          .timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: section,
              start: () => `top ${header?.offsetHeight ?? 0}px`,
              end: PIN_LENGTH,
              scrub: 0.5,
              pin: true,
              invalidateOnRefresh: true,
            },
          })
          .to(
            state,
            {
              frame: frames.count - 1,
              duration: 1,
              onUpdate: () => draw(),
            },
            0,
          )
          .to(
            title.words,
            {
              yPercent: -60,
              opacity: 0,
              stagger: 0.015,
              duration: 0.18,
              ease: "power1.in",
            },
            0.04,
          )
          .to(
            "[data-hero-lede]",
            { opacity: 0, y: -24, duration: 0.14, ease: "power1.in" },
            0.06,
          )
          .to(
            outro.words,
            {
              yPercent: 0,
              opacity: 1,
              stagger: 0.03,
              duration: 0.2,
              ease: "power2.out",
            },
            0.62,
          )
          // Chalk off the hands at lockout. Opacity and transform only.
          .fromTo(
            chalk,
            { opacity: 0, scale: 1.12, xPercent: -6 },
            {
              opacity: 0.5,
              scale: 1,
              xPercent: 0,
              duration: 0.3,
              ease: "power2.out",
            },
            0.58,
          );

        return () => {
          window.removeEventListener("load", start);
          observer.disconnect();
          sequence.dispose();
        };
      });
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      aria-labelledby={labelledBy}
      className="relative isolate h-[calc(100svh-4rem)] min-h-[34rem] overflow-hidden bg-iron"
    >
      {/* Media layer. Landscape and tablets: fills the hero. Portrait phones: a band across the top,
          BAND_VISIBLE of the frame wide, so the whole lift stays in shot and the
          text sits below it instead of on top of the lifter. */}
      <div
        className="absolute inset-x-0 top-0 -z-10 h-full overflow-hidden max-sm:portrait:h-auto max-sm:portrait:aspect-(--hero-band)"
        style={
          {
            "--hero-band": `${frames.width * BAND_VISIBLE} / ${frames.height}`,
          } as React.CSSProperties
        }
      >
        {poster}
        {/* biome-ignore lint/a11y/noAriaHiddenOnFocusable: canvas is not focusable; it is purely decorative */}
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="absolute inset-0 size-full opacity-0"
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 hidden h-1/3 bg-linear-to-t from-iron to-transparent max-sm:portrait:block"
        />
      </div>
      {children}
      {/* Above the scrim, below the text. Screen drops the black; the mask keeps
          dust off the closing line and CTAs. No src until the sequence runs. */}
      {/* biome-ignore lint/performance/noImgElement: static export has no image optimizer, and src is set at runtime */}
      <img
        ref={chalkRef}
        alt=""
        aria-hidden="true"
        decoding="async"
        className="pointer-events-none absolute inset-0 -z-10 size-full object-cover object-right-top opacity-0 mix-blend-screen [mask-image:linear-gradient(to_bottom,black_15%,transparent_55%)]"
      />
    </section>
  );
}
