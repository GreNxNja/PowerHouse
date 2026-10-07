import { ArrowLeftIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ClassImage } from "@/components/content/class-image";
import { CtaLink } from "@/components/layout/cta-link";
import { PageTransition } from "@/components/page-transition";
import { Picture } from "@/components/picture";
import {
  classes,
  getClass,
  getTrainerOrThrow,
  gym,
  sessionsForClass,
} from "@/content";
import { navTransition } from "@/lib/animations";
import { categoryLabel, dayLabel, formatTime, levelLabel } from "@/lib/format";
import { pageMetadata } from "@/lib/seo";

// Static export: every slug is known at build time, anything else is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return classes.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/classes/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const item = getClass(slug);
  if (!item) return {};
  return pageMetadata({
    title: item.name,
    description: item.summary,
    card: `classes/${item.slug}`,
  });
}

export default async function ClassPage({
  params,
}: PageProps<"/classes/[slug]">) {
  const { slug } = await params;
  const item = getClass(slug);
  if (!item) notFound();

  const sessions = sessionsForClass(item.slug);
  const coaches = item.coaches.map(getTrainerOrThrow);

  return (
    <PageTransition>
      <article className="mx-auto max-w-7xl px-4 pt-10 pb-24 sm:px-6">
        <Link
          href="/classes"
          transitionTypes={navTransition.back}
          className="inline-flex h-11 items-center gap-2 text-sm text-slate hover:text-foreground"
        >
          <ArrowLeftIcon aria-hidden="true" className="size-4" />
          All classes
        </Link>

        <header className="mt-6 grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:items-end">
          <div>
            <p className="text-sm text-slate">
              {categoryLabel(item.category)} · {levelLabel(item.level)} ·{" "}
              {item.durationMinutes} min
            </p>
            <h1 className="mt-2 text-4xl leading-[0.95] font-black tracking-tight sm:text-6xl">
              {item.name}
            </h1>
            <p className="mt-6 max-w-prose text-lg text-slate">
              {item.summary}
            </p>
          </div>
          <ClassImage
            item={item}
            sizes="(min-width: 1024px) 40vw, (min-width: 640px) 28rem, 100vw"
            className="sm:max-w-md lg:max-w-none"
            priority
          />
        </header>

        <div className="mt-16 grid gap-16 lg:grid-cols-[1.4fr_1fr]">
          <div className="max-w-prose">
            {item.description.map((p) => (
              <p key={p.slice(0, 32)} className="mb-4 text-lg">
                {p}
              </p>
            ))}

            <h2 className="mt-12 text-2xl font-extrabold tracking-tight">
              Who it’s for
            </h2>
            <p className="mt-3">{item.whoItsFor}</p>

            <h2 className="mt-12 text-2xl font-extrabold tracking-tight">
              What a session looks like
            </h2>
            <ol className="mt-4 grid gap-3">
              {item.whatToExpect.map((step, i) => (
                <li key={step} className="flex gap-4 border-t pt-3">
                  <span className="w-6 shrink-0 font-display font-extrabold text-slate tabular-nums">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          <aside className="grid content-start gap-12">
            <section aria-labelledby="when">
              <h2 id="when" className="text-2xl font-extrabold tracking-tight">
                When it runs
              </h2>
              {sessions.length > 0 ? (
                <ul className="mt-4">
                  {sessions.map((s) => (
                    <li
                      key={`${s.day}-${s.start}`}
                      className="flex justify-between gap-4 border-t py-3"
                    >
                      <span>{dayLabel(s.day)}</span>
                      <span className="text-slate tabular-nums">
                        {formatTime(s.start, gym.locale)}–
                        {formatTime(s.end, gym.locale)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-slate">
                  Not on this week’s timetable. Ask us about the next block.
                </p>
              )}
              <Link
                href="/timetable"
                transitionTypes={navTransition.lateral}
                className="mt-4 inline-block text-sm underline underline-offset-4"
              >
                See the full timetable
              </Link>
            </section>

            <section aria-labelledby="coaches">
              <h2
                id="coaches"
                className="text-2xl font-extrabold tracking-tight"
              >
                {coaches.length === 1 ? "Your coach" : "Your coaches"}
              </h2>
              <ul className="mt-4 grid gap-4">
                {coaches.map((t) => (
                  <li key={t.slug} className="flex items-center gap-4">
                    <Picture
                      src={t.image}
                      alt=""
                      sizes="64px"
                      className="block size-16 shrink-0 overflow-hidden rounded-sm bg-rubber"
                      imgClassName="size-16 object-cover object-[50%_20%]"
                    />
                    <div>
                      <Link
                        href={`/trainers#${t.slug}`}
                        transitionTypes={navTransition.lateral}
                        className="font-medium underline-offset-4 hover:underline"
                      >
                        {t.name}
                      </Link>
                      <p className="text-sm text-slate">{t.role}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <section className="surface-iron rounded-sm p-6">
              <h2 className="text-xl font-extrabold tracking-tight">
                Try it free
              </h2>
              <p className="mt-2 text-muted-foreground">
                Your first session is on us. A coach will meet you and talk you
                through it.
              </p>
              <CtaLink className="mt-6" />
            </section>
          </aside>
        </div>
      </article>
    </PageTransition>
  );
}
