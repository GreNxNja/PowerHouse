"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { applyTheme, THEME_KEY } from "@/lib/theme";
import { cn } from "@/lib/utils";

/**
 * Evening theme switch. A toggle button (aria-pressed), not a link or menu.
 * Crossfades the page through a view transition; instant under reduced motion
 * or where view transitions aren't supported.
 */
export function ThemeToggle({ className }: { className?: string }) {
  // Unknown until mounted: the server can't know the visitor's theme.
  const [evening, setEvening] = useState<boolean | null>(null);

  useEffect(() => {
    const current = document.documentElement.classList.contains("dark");
    // Re-apply so the browser's theme-color matches a stored choice, not just
    // the system setting the <meta media> tags assume.
    applyTheme(current);
    setEvening(current);
    // Follow the system live, unless the visitor has chosen explicitly.
    const system = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystemChange = () => {
      try {
        if (localStorage.getItem(THEME_KEY)) return;
      } catch {}
      applyTheme(system.matches);
      setEvening(system.matches);
    };
    system.addEventListener("change", onSystemChange);
    return () => system.removeEventListener("change", onSystemChange);
  }, []);

  const toggle = () => {
    const next = !document.documentElement.classList.contains("dark");
    try {
      localStorage.setItem(THEME_KEY, next ? "evening" : "day");
    } catch {}
    const run = () => {
      applyTheme(next);
      // Inside the transition callback, so the icon change is in the new snapshot.
      flushSync(() => setEvening(next));
    };
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduce || !document.startViewTransition) {
      run();
      return;
    }
    const root = document.documentElement;
    root.classList.add("theme-switching");
    const transition = document.startViewTransition(run);
    void transition.finished.finally(() =>
      root.classList.remove("theme-switching"),
    );
  };

  const on = evening === true;
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label="Evening theme"
      title={on ? "Switch to day theme" : "Switch to evening theme"}
      onClick={toggle}
      className={cn(
        "inline-flex size-11 items-center justify-center rounded-sm text-foreground transition-colors duration-150 hover:bg-muted",
        className,
      )}
    >
      {on ? (
        <SunIcon aria-hidden="true" className="size-5" />
      ) : (
        <MoonIcon aria-hidden="true" className="size-5" />
      )}
    </button>
  );
}
