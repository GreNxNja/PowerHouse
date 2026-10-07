"use client";

import Script from "next/script";
import { useEffect } from "react";
import { track } from "@/lib/analytics";

const DOMAIN = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
const SRC =
  process.env.NEXT_PUBLIC_PLAUSIBLE_SRC ?? "https://plausible.io/js/script.js";

/**
 * Loads Plausible when configured, and tracks contact clicks anywhere on the
 * page with one delegated listener, so links can stay in Server Components.
 */
export function Analytics() {
  useEffect(() => {
    // Queue events fired before the script arrives (Plausible's own stub).
    window.plausible =
      window.plausible ??
      Object.assign(
        (...args: unknown[]) => {
          if (!window.plausible) return;
          window.plausible.q = window.plausible.q ?? [];
          window.plausible.q.push(args);
        },
        { q: [] as unknown[] },
      );

    const onClick = (e: MouseEvent) => {
      const link = (e.target as Element | null)?.closest?.("a[href]");
      if (!link) return;
      const href = link.getAttribute("href") ?? "";
      const where = window.location.pathname;
      if (href.startsWith("tel:")) track("Click to call", { page: where });
      else if (href.startsWith("https://wa.me/"))
        track("WhatsApp click", { page: where });
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  if (!DOMAIN) return null;
  return <Script src={SRC} data-domain={DOMAIN} strategy="afterInteractive" />;
}
