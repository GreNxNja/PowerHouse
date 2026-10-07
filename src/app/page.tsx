import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { ClassCard } from "@/components/content/class-card";
import { FacilityGallery } from "@/components/content/facility-gallery";
import { Hero } from "@/components/hero/hero";
import { CtaLink } from "@/components/layout/cta-link";
import { Magnetic } from "@/components/magnetic";
import { PageTransition } from "@/components/page-transition";
import { Picture } from "@/components/picture";
import { featuredClasses, gym, lowestMonthlyPrice, trainers } from "@/content";
import { navTransition } from "@/lib/animations";
import { formatPrice } from "@/lib/format";

const steps = [
  {
    title: "Book a time",
    body: "Pick a slot online, or call or message us. Early mornings, evenings and weekends all work.",
  },
  {
    title: "Meet a coach",
    body: "About an hour together: a look around, what you want from training, and a few lifts to find your starting point.",
  },
  {
    title: "Get a plan",
    body: "You leave knowing which classes suit you and what to lift next time. Join if you like it.",
  },
];

function SectionHeading({
  id,
  title,
  href,
  linkLabel,
}: {
  id: string;
  title: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <h2 id={id} className="text-3xl font-black tracking-tight sm:text-5xl">
        {title}
      </h2>
      <Link
        href={href}
        transitionTypes={navTransition.lateral}
        className="inline-flex h-11 items-center gap-2 font-medium underline-offset-4 hover:underline"
      >
        {linkLabel}
        <ArrowRightIcon aria-hidden="true" className="size-4" />
      </Link>
    </div>
  );
}

export default function Home() {
  return (
    <PageTransition>
      <Hero />

      <section
        aria-labelledby="classes-title"
        className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32"
      >
        <SectionHeading
          id="classes-title"
          title="Classes for every stage."
          href="/classes"
          linkLabel="All classes"
        />
        <ul className="mt-12 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {featuredClasses.map((c) => (
            <li key={c.slug}>
              <ClassCard item={c} />
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="trainers-title" className="texture-concrete">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32">
          <SectionHeading
            id="trainers-title"
            title="Coaches who know your numbers."
            href="/trainers"
            linkLabel="Meet the team"
          />
          <ul className="mt-12 grid grid-cols-2 gap-6 lg:grid-cols-4">
            {trainers.map((t) => (
              <li key={t.slug} className="group relative">
                <Picture
                  src={t.image}
                  alt=""
                  sizes="(min-width: 1024px) 25vw, 50vw"
                  className="block overflow-hidden rounded-sm bg-rubber"
                  imgClassName="aspect-[3/4] object-cover"
                />
                <h3 className="mt-3 text-lg font-extrabold tracking-tight">
                  <Link
                    href={`/trainers#${t.slug}`}
                    transitionTypes={navTransition.lateral}
                    className="after:absolute after:inset-0 group-hover:underline"
                  >
                    {t.name}
                  </Link>
                </h3>
                <p className="text-sm text-slate">{t.role}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {gym.gallery.length > 0 && (
        <section aria-labelledby="space-title" className="border-b">
          <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32">
            <div className="grid gap-6 md:grid-cols-2 md:items-end">
              <h2
                id="space-title"
                className="text-3xl font-black tracking-tight sm:text-5xl"
              >
                Built for lifting.
              </h2>
              <p className="max-w-prose text-lg text-slate">
                Racks and platforms along the windows, iron for every lift, and
                room to move between sets. Come and see it on your free session.
              </p>
            </div>
            <div className="mt-12">
              <FacilityGallery photos={gym.gallery} />
            </div>
          </div>
        </section>
      )}

      <section
        aria-labelledby="membership-title"
        className="mx-auto grid max-w-7xl gap-8 px-4 py-24 sm:px-6 sm:py-32 md:grid-cols-2 md:items-end"
      >
        <div>
          <h2
            id="membership-title"
            className="text-3xl font-black tracking-tight sm:text-5xl"
          >
            Memberships from{" "}
            {formatPrice(lowestMonthlyPrice, gym.currency, gym.locale)} a month.
          </h2>
          <p className="mt-6 max-w-prose text-lg text-slate">
            Open gym, two coached classes a week, or every class on the
            timetable. Monthly or annual, and you can freeze any plan.
          </p>
        </div>
        <Link
          href="/membership"
          transitionTypes={navTransition.lateral}
          className="inline-flex h-11 items-center gap-2 font-medium underline-offset-4 hover:underline md:justify-self-end"
        >
          Compare plans
          <ArrowRightIcon aria-hidden="true" className="size-4" />
        </Link>
      </section>

      <section aria-labelledby="trial-title" className="border-t">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32">
          <h2
            id="trial-title"
            className="max-w-3xl text-3xl font-black tracking-tight sm:text-5xl"
          >
            How your free session works.
          </h2>
          <ol className="mt-12 grid gap-10 md:grid-cols-3">
            {steps.map((s, i) => (
              <li key={s.title} className="border-t-2 border-foreground pt-4">
                <span className="font-display text-sm font-extrabold text-slate tabular-nums">
                  0{i + 1}
                </span>
                <h3 className="mt-2 text-xl font-extrabold tracking-tight">
                  {s.title}
                </h3>
                <p className="mt-2 max-w-prose text-slate">{s.body}</p>
              </li>
            ))}
          </ol>
          <div className="mt-12">
            <Magnetic>
              <CtaLink className="h-12 px-6 text-base" />
            </Magnetic>
          </div>
        </div>
      </section>
    </PageTransition>
  );
}
