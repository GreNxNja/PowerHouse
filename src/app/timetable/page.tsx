import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/content/page-header";
import { PageTransition } from "@/components/page-transition";
import {
  getClassOrThrow,
  getTrainerOrThrow,
  gym,
  sessionsForDay,
  timetable,
} from "@/content";
import { navTransition } from "@/lib/animations";
import { dayLabel, formatDate, formatTime } from "@/lib/format";
import { days } from "@/lib/schemas";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Timetable",
  description:
    "This week's coached classes at PowerHouse, from 6:00 AM barbell sessions to weekend Olympic lifting.",
  card: "timetable",
});

export default function TimetablePage() {
  return (
    <PageTransition>
      <PageHeader eyebrow="Timetable" title="This week on the floor.">
        <p>
          Open gym runs all day around these classes. Your first class is free,
          and a coach will meet you at the door.
        </p>
        <p className="mt-2 text-sm">
          Updated {formatDate(timetable.updated, gym.locale)}.
        </p>
      </PageHeader>

      <div className="mx-auto grid max-w-7xl gap-x-8 gap-y-14 px-4 pb-24 sm:px-6 md:grid-cols-2 xl:grid-cols-3">
        {days.map((day) => {
          const sessions = sessionsForDay(day);
          return (
            <section key={day} aria-labelledby={`day-${day}`}>
              <h2
                id={`day-${day}`}
                className="border-b-2 border-foreground pb-2 text-2xl font-extrabold tracking-tight"
              >
                {dayLabel(day)}
              </h2>
              {sessions.length === 0 ? (
                <p className="py-3 text-slate">Open gym only.</p>
              ) : (
                <ul>
                  {sessions.map((s) => {
                    const c = getClassOrThrow(s.classSlug);
                    const t = getTrainerOrThrow(s.trainerSlug);
                    return (
                      <li
                        key={`${s.start}-${s.classSlug}`}
                        className="grid grid-cols-[6.5rem_1fr] gap-x-4 border-b py-3"
                      >
                        <span className="text-slate tabular-nums">
                          <time dateTime={s.start}>
                            {formatTime(s.start, gym.locale)}
                          </time>
                          <span className="sr-only"> to </span>
                          <span aria-hidden="true">–</span>
                          <br />
                          <time dateTime={s.end}>
                            {formatTime(s.end, gym.locale)}
                          </time>
                        </span>
                        <span>
                          <Link
                            href={`/classes/${c.slug}`}
                            transitionTypes={navTransition.forward}
                            className="font-medium underline-offset-4 hover:underline"
                          >
                            {c.name}
                          </Link>
                          <span className="block text-sm text-slate">
                            with {t.name}
                          </span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </PageTransition>
  );
}
