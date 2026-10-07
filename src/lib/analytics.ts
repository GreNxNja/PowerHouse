/**
 * Cookieless analytics via Plausible (custom events are why it's Plausible and
 * not Cloudflare Web Analytics). Calls are no-ops when Plausible isn't loaded,
 * e.g. in development or when NEXT_PUBLIC_PLAUSIBLE_DOMAIN is unset.
 */

export type AnalyticsEvent =
  | "Trial form start"
  | "Trial form submit"
  | "Trial form error"
  | "Click to call"
  | "WhatsApp click";

type Plausible = ((
  event: string,
  options?: { props?: Record<string, string> },
) => void) & { q?: unknown[] };

declare global {
  interface Window {
    plausible?: Plausible;
  }
}

export function track(event: AnalyticsEvent, props?: Record<string, string>) {
  if (typeof window === "undefined") return;
  window.plausible?.(event, props ? { props } : undefined);
}
