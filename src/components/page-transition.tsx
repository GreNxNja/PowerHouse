import { ViewTransition } from "react";

const types = {
  "nav-lateral": "nav-lateral",
  "nav-forward": "nav-forward",
  "nav-back": "nav-back",
  default: "none",
};

/**
 * Wrap each page's content (in page.tsx, not a layout: layouts persist, so
 * enter/exit never fire there). Untyped navigations, such as the browser back
 * button, don't animate.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter={types} exit={types} default="none">
      {children}
    </ViewTransition>
  );
}
