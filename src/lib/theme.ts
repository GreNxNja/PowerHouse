/**
 * Day / evening theme. The class `dark` on <html> turns evening on (it also
 * drives shadcn's `dark:` variants). Default follows the system; the header
 * toggle stores an explicit choice.
 */
export const THEME_KEY = "powerhouse-theme";
export const THEME_COLOR = { day: "#f3f5f4", evening: "#111518" } as const;

/**
 * Runs in <head> before first paint, so evening visitors never see a flash of
 * the day theme. Kept tiny and dependency-free; it is inlined as a string.
 */
export const themeInitScript = `(function(){try{var s=localStorage.getItem("${THEME_KEY}");var e=s?s==="evening":matchMedia("(prefers-color-scheme: dark)").matches;var r=document.documentElement;r.classList.toggle("dark",e);r.style.colorScheme=e?"dark":"light";}catch(_){}})();`;

export function applyTheme(evening: boolean) {
  const root = document.documentElement;
  root.classList.toggle("dark", evening);
  root.style.colorScheme = evening ? "dark" : "light";
  for (const meta of document.querySelectorAll<HTMLMetaElement>(
    'meta[name="theme-color"]',
  )) {
    meta.content = evening ? THEME_COLOR.evening : THEME_COLOR.day;
  }
}
