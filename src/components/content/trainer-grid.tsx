"use client";

import { LayoutGroup, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { duration, easeFluid } from "@/lib/animations";
import { cn } from "@/lib/utils";

type Item = {
  slug: string;
  name: string;
  summary: React.ReactNode;
  details: React.ReactNode;
};

const layoutTransition = { duration: duration.slow, ease: easeFluid };

/**
 * Trainer cards that expand in place to a full-width profile. Size changes run
 * as Motion layout (FLIP) animations, so only transforms animate.
 *
 * Collapsed details stay in the HTML (good for search) behind
 * hidden="until-found", so find-in-page can still reach them and opens the
 * card when it does. /trainers#slug opens that trainer on arrival.
 */
export function TrainerGrid({ items }: { items: Item[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const listRef = useRef<HTMLUListElement>(null);
  // Where to scroll once the expand has finished moving the card.
  const pendingScroll = useRef<{ slug: string; block: ScrollLogicalPosition }>(
    null,
  );
  const reduce = useReducedMotion();

  const expand = (slug: string | null, block: ScrollLogicalPosition) => {
    pendingScroll.current = slug ? { slug, block } : null;
    setOpen(slug);
  };

  // An expanded card can jump to a new row. Scroll after the layout animation,
  // not before, or we land where the card used to be.
  useEffect(() => {
    const target = pendingScroll.current;
    if (!target || target.slug !== open) return;
    const wait = reduce ? 0 : duration.slow * 1000 + 50;
    const id = window.setTimeout(() => {
      document
        .getElementById(target.slug)
        ?.scrollIntoView({ block: target.block, behavior: "instant" });
      pendingScroll.current = null;
    }, wait);
    return () => window.clearTimeout(id);
  }, [open, reduce]);

  // Deep links: /trainers#maya-okafor (also on in-page hash changes).
  useEffect(() => {
    const fromHash = () => {
      const slug = decodeURIComponent(window.location.hash.slice(1));
      if (!items.some((i) => i.slug === slug)) return;
      pendingScroll.current = { slug, block: "start" };
      setOpen(slug);
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, [items]);

  // React only knows boolean `hidden`, so upgrade collapsed panels after render.
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-run whenever `open` changes, because React rewrites `hidden` on those renders
  useEffect(() => {
    const panels =
      listRef.current?.querySelectorAll<HTMLElement>("[data-trainer-panel]") ??
      [];
    const onMatch = (e: Event) => {
      const slug = (e.currentTarget as HTMLElement).dataset.trainerPanel;
      if (slug) setOpen(slug);
    };
    for (const panel of panels) {
      if (panel.hidden) panel.setAttribute("hidden", "until-found");
      panel.addEventListener("beforematch", onMatch);
    }
    return () => {
      for (const panel of panels)
        panel.removeEventListener("beforematch", onMatch);
    };
  }, [open]);

  return (
    <LayoutGroup>
      <ul
        ref={listRef}
        className="grid grid-cols-1 gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-4"
      >
        {items.map((item) => {
          const expanded = open === item.slug;
          const panelId = `${item.slug}-profile`;
          return (
            <motion.li
              key={item.slug}
              id={item.slug}
              layout
              transition={layoutTransition}
              className={cn(
                "scroll-mt-24",
                expanded &&
                  "grid gap-8 sm:col-span-2 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:gap-12 lg:col-span-4",
              )}
            >
              <motion.div layout transition={layoutTransition}>
                {item.summary}
                <button
                  type="button"
                  aria-expanded={expanded}
                  aria-controls={panelId}
                  onClick={() => expand(expanded ? null : item.slug, "nearest")}
                  className="mt-3 inline-flex h-11 items-center rounded-sm border border-input px-4 text-sm font-medium transition-colors duration-150 hover:bg-muted"
                >
                  {expanded ? "Close profile" : `Read ${item.name}’s profile`}
                </button>
              </motion.div>
              <motion.div
                id={panelId}
                data-trainer-panel={item.slug}
                hidden={!expanded}
                layout="position"
                initial={false}
                animate={{ opacity: expanded ? 1 : 0 }}
                transition={{
                  duration: duration.base,
                  delay: expanded ? 0.15 : 0,
                }}
                className="max-w-prose md:pt-4"
              >
                {item.details}
              </motion.div>
            </motion.li>
          );
        })}
      </ul>
    </LayoutGroup>
  );
}
