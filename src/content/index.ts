/**
 * Content loader. Every JSON file is parsed with zod when this module is first
 * imported, which happens during `next build`, so bad content fails the build.
 * Cross-file references (slugs, images, times) are checked here too.
 */
import type { z } from "zod";
import {
  type ClassCategory,
  type Day,
  days,
  type GymClass,
  gymClassSchema,
  gymSchema,
  imageManifestSchema,
  membershipSchema,
  type Session,
  type Trainer,
  timetableSchema,
  trainerSchema,
} from "@/lib/schemas";
import classesJson from "./classes.json";
import gymJson from "./gym.json";
import imagesJson from "./images.json";
import membershipJson from "./membership.json";
import timetableJson from "./timetable.json";
import trainersJson from "./trainers.json";

function parse<T extends z.ZodType>(
  name: string,
  schema: T,
  data: unknown,
): z.infer<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(`Invalid content in ${name}:\n${result.error.message}`);
  }
  return result.data;
}

function check(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(`Content error: ${message}`);
}

const minutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

// ---------- Parse ----------

export const images = parse("images.json", imageManifestSchema, imagesJson);
export const gym = parse("gym.json", gymSchema, gymJson);
export const classes = parse(
  "classes.json",
  gymClassSchema.array(),
  classesJson,
);
export const trainers = parse(
  "trainers.json",
  trainerSchema.array(),
  trainersJson,
);
export const membership = parse(
  "membership.json",
  membershipSchema,
  membershipJson,
);
export const timetable = parse(
  "timetable.json",
  timetableSchema,
  timetableJson,
);

const classBySlug = new Map(classes.map((c) => [c.slug, c]));
const trainerBySlug = new Map(trainers.map((t) => [t.slug, t]));

// ---------- Cross-checks ----------

check(classBySlug.size === classes.length, "duplicate class slug");
check(trainerBySlug.size === trainers.length, "duplicate trainer slug");

for (const item of [...classes, ...trainers]) {
  check(
    item.image in images,
    `"${item.slug}" uses image "${item.image}", which is not in images.json (run npm run images)`,
  );
}
for (const photo of [...gym.gallery, ...(gym.exterior ? [gym.exterior] : [])]) {
  check(
    photo.image in images,
    `gym.json uses image "${photo.image}", which is not in images.json (run npm run images)`,
  );
}
for (const c of classes) {
  for (const coach of c.coaches) {
    check(
      trainerBySlug.has(coach),
      `class "${c.slug}" lists unknown coach "${coach}"`,
    );
  }
}

const planIds = new Set(membership.plans.map((p) => p.id));
for (const row of membership.comparison) {
  for (const id of planIds) {
    check(
      id in row.values,
      `comparison row "${row.feature}" is missing plan "${id}"`,
    );
  }
}
for (const plan of membership.plans) {
  check(
    plan.annualMonthly <= plan.monthly,
    `plan "${plan.id}" annual price is higher than monthly`,
  );
}

const hoursFor = (day: Day) => gym.hours.find((h) => h.days.includes(day));

for (const day of days) {
  const sessions = timetable.week[day] ?? [];
  for (const s of sessions) {
    const where = `${day} ${s.start}`;
    const c = classBySlug.get(s.classSlug);
    check(c !== undefined, `${where}: unknown class "${s.classSlug}"`);
    check(
      trainerBySlug.has(s.trainerSlug),
      `${where}: unknown trainer "${s.trainerSlug}"`,
    );
    check(
      c.coaches.includes(s.trainerSlug),
      `${where}: ${s.trainerSlug} is not listed as a coach for ${c.slug}`,
    );
    check(
      minutes(s.end) - minutes(s.start) === c.durationMinutes,
      `${where}: length does not match ${c.slug} (${c.durationMinutes} min)`,
    );
    const open = hoursFor(day);
    check(
      open !== undefined &&
        minutes(s.start) >= minutes(open.opens) &&
        minutes(s.end) <= minutes(open.closes),
      `${where}: outside opening hours`,
    );
  }
  // A trainer can't be in two places at once.
  const sorted = [...sessions].sort(
    (a, b) => minutes(a.start) - minutes(b.start),
  );
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      const a = sorted[i];
      const b = sorted[j];
      if (a.trainerSlug !== b.trainerSlug) continue;
      check(
        minutes(b.start) >= minutes(a.end),
        `${day}: ${a.trainerSlug} is double-booked at ${b.start}`,
      );
    }
  }
}

// ---------- Queries ----------

export function getClass(slug: string): GymClass | undefined {
  return classBySlug.get(slug);
}

export function getTrainer(slug: string): Trainer | undefined {
  return trainerBySlug.get(slug);
}

export function getTrainerOrThrow(slug: string): Trainer {
  const trainer = trainerBySlug.get(slug);
  check(trainer !== undefined, `unknown trainer "${slug}"`);
  return trainer;
}

export function getClassOrThrow(slug: string): GymClass {
  const c = classBySlug.get(slug);
  check(c !== undefined, `unknown class "${slug}"`);
  return c;
}

export const featuredClasses = classes.filter((c) => c.featured);

/** Classes a trainer coaches, in timetable order of first appearance. */
export function classesCoachedBy(trainerSlug: string): GymClass[] {
  return classes.filter((c) => c.coaches.includes(trainerSlug));
}

/** Weekly sessions for one class, ordered Monday to Sunday. */
export function sessionsForClass(slug: string): (Session & { day: Day })[] {
  return days.flatMap((day) =>
    (timetable.week[day] ?? [])
      .filter((s) => s.classSlug === slug)
      .map((s) => ({ ...s, day })),
  );
}

export function sessionsForDay(day: Day): Session[] {
  return [...(timetable.week[day] ?? [])].sort(
    (a, b) => minutes(a.start) - minutes(b.start),
  );
}

export const categoriesInUse: ClassCategory[] = [
  ...new Set(classes.map((c) => c.category)),
];

export const lowestMonthlyPrice = Math.min(
  ...membership.plans.map((p) => p.annualMonthly),
);
