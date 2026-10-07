import Link from "next/link";
import { CtaLink } from "@/components/layout/cta-link";
import { Magnetic } from "@/components/magnetic";
import { Picture } from "@/components/picture";
import { navTransition } from "@/lib/animations";
import frames from "./frames.json";
import { HeroScroller } from "./hero-scroller";

/**
 * Server-rendered hero. All text is real DOM text and readable without JS;
 * HeroScroller adds the pinned frame sequence on top when motion is allowed.
 */
export function Hero() {
  return (
    <HeroScroller
      labelledBy="hero-title"
      poster={
        <Picture
          src="hero/poster"
          alt=""
          sizes="100vw"
          priority
          className="absolute inset-0 block"
          // Same focal points the canvas uses (see BAND_QUERY in hero-scroller).
          imgClassName="h-full object-cover object-(--hero-pos-cover) max-sm:portrait:object-(--hero-pos-band)"
          imgStyle={
            {
              "--hero-pos-cover": `${frames.position.cover * 100}% 50%`,
              "--hero-pos-band": `${frames.position.band * 100}% 50%`,
            } as React.CSSProperties
          }
        />
      }
    >
      {/* Legibility scrim, above poster and canvas. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-linear-to-t from-iron via-iron/60 to-iron/10"
      />
      <div className="mx-auto flex h-full max-w-7xl flex-col justify-end px-4 pb-14 short-portrait:pb-6 sm:px-6 sm:pb-20">
        <div className="grid">
          <div className="[grid-area:1/1]">
            <h1
              id="hero-title"
              data-hero-title
              className="max-w-5xl text-5xl leading-[0.92] font-black tracking-tight text-chalk short-portrait:text-[2.1rem] sm:text-8xl"
            >
              Lift heavy. Get coached properly.
            </h1>
            <p
              data-hero-lede
              className="mt-6 max-w-prose text-lg text-concrete short-portrait:mt-3 short-portrait:text-base sm:text-xl"
            >
              Strength classes, open gym and coaches who watch every rep. Your
              first session is free.
            </p>
          </div>
          {/* Revealed by the scroll sequence only. Stays hidden without it. */}
          <p
            data-hero-outro
            className="invisible max-w-4xl self-end font-display text-4xl short-portrait:text-[2.1rem] leading-[0.95] font-black tracking-tight text-chalk [font-stretch:125%] [grid-area:1/1] sm:text-7xl"
          >
            Every rep, coached.
          </p>
        </div>
        <div className="mt-10 flex flex-wrap items-center gap-6 short-portrait:mt-5">
          <Magnetic>
            <CtaLink className="h-12 px-6 text-base" />
          </Magnetic>
          <Link
            href="/timetable"
            transitionTypes={navTransition.lateral}
            className="inline-flex h-11 items-center font-medium text-chalk underline underline-offset-4"
          >
            See the timetable
          </Link>
        </div>
      </div>
    </HeroScroller>
  );
}
