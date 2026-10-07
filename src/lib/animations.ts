/** Shared motion tokens. Mirrors --ease-fluid in globals.css. */
export const easeFluid = [0.22, 1, 0.36, 1] as const;

/** Seconds, for Motion and GSAP. */
export const duration = {
  fast: 0.15,
  base: 0.3,
  slow: 0.6,
} as const;

/** Transition types passed to <Link transitionTypes>. Styled in globals.css. */
export const navTransition = {
  lateral: ["nav-lateral"],
  forward: ["nav-forward"],
  back: ["nav-back"],
} satisfies Record<string, string[]>;
