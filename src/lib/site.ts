export type NavItem = { href: string; label: string };

export const site = {
  name: "PowerHouse",
  tagline: "Strength training, coached properly.",
  description:
    "PowerHouse is a strength gym with coached classes, open training and a free first session.",
  nav: [
    { href: "/classes", label: "Classes" },
    { href: "/timetable", label: "Timetable" },
    { href: "/trainers", label: "Trainers" },
    { href: "/membership", label: "Membership" },
    { href: "/contact", label: "Contact" },
  ] satisfies NavItem[],
  cta: { href: "/contact#trial", label: "Book a free session" },
} as const;
