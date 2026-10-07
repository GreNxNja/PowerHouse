"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { duration, easeFluid } from "@/lib/animations";
import { categoryLabel } from "@/lib/format";
import type { ClassCategory } from "@/lib/schemas";
import { cn } from "@/lib/utils";

type Item = { slug: string; category: ClassCategory; card: React.ReactNode };

/**
 * Client-side filter over server-rendered cards. Cards arrive as nodes, so the
 * content loader and zod never ship to the browser.
 *
 * Cards that stay slide to their new grid cell (Motion layout = FLIP transforms);
 * cards that leave are popped out of flow so the rest move at once.
 * Under reduced motion MotionConfig skips the movement and keeps the fades.
 */
export function ClassBrowser({
  items,
  categories,
}: {
  items: Item[];
  categories: ClassCategory[];
}) {
  const [active, setActive] = useState<ClassCategory | "all">("all");
  const visible =
    active === "all" ? items : items.filter((i) => i.category === active);

  const chips: (ClassCategory | "all")[] = ["all", ...categories];

  return (
    <div>
      <fieldset>
        <legend className="sr-only">Filter classes by type</legend>
        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <button
              key={chip}
              type="button"
              aria-pressed={active === chip}
              onClick={() => setActive(chip)}
              className={cn(
                "h-11 rounded-sm border border-input px-4 text-sm font-medium transition-colors duration-150",
                active === chip
                  ? "border-foreground bg-foreground text-background"
                  : "bg-background text-foreground hover:bg-muted",
              )}
            >
              {chip === "all" ? "All classes" : categoryLabel(chip)}
            </button>
          ))}
        </div>
      </fieldset>
      <p className="sr-only" aria-live="polite">
        Showing {visible.length} {visible.length === 1 ? "class" : "classes"}
      </p>
      <ul className="relative mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence initial={false} mode="popLayout">
          {visible.map((item) => (
            <motion.li
              key={item.slug}
              layout="position"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{
                duration: duration.base,
                ease: easeFluid,
                layout: { duration: duration.slow, ease: easeFluid },
              }}
            >
              {item.card}
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}
