import type { Day, Level } from "@/lib/schemas";

export function formatPrice(amount: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

/** "17:30" -> "5:30 PM" in the gym's locale. Built in UTC so the server timezone can't shift it. */
export function formatTime(hhmm: string, locale: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(Date.UTC(2000, 0, 1, h, m));
}

export function formatDate(iso: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${iso}T00:00:00Z`));
}

const dayLabels: Record<Day, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

export function dayLabel(day: Day) {
  return dayLabels[day];
}

/** ["monday", …, "friday"] -> "Monday to Friday". Assumes consecutive days. */
export function dayRange(list: Day[]) {
  if (list.length === 1) return dayLabels[list[0]];
  return `${dayLabels[list[0]]} to ${dayLabels[list[list.length - 1]]}`;
}

const levelLabels: Record<Level, string> = {
  all: "All levels",
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export function levelLabel(level: Level) {
  return levelLabels[level];
}

export function categoryLabel(category: string) {
  return category.charAt(0).toUpperCase() + category.slice(1);
}
