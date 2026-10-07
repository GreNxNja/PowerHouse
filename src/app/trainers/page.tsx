import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/content/page-header";
import { TrainerGrid } from "@/components/content/trainer-grid";
import { PageTransition } from "@/components/page-transition";
import { Picture } from "@/components/picture";
import { classesCoachedBy, trainers } from "@/content";
import { navTransition } from "@/lib/animations";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Trainers",
  description:
    "Meet the PowerHouse coaching team: powerlifting, Olympic lifting, conditioning and mobility specialists.",
  card: "trainers",
});

export default function TrainersPage() {
  return (
    <PageTransition>
      <PageHeader eyebrow="Trainers" title="The people watching your reps.">
        <p>
          Every coach here programs, coaches and trains on the same floor as
          you. Most of them will know your name by your second week.
        </p>
      </PageHeader>
      <div className="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
        <TrainerGrid
          items={trainers.map((t, i) => ({
            slug: t.slug,
            name: t.name,
            summary: (
              <>
                <Picture
                  src={t.image}
                  alt={t.imageAlt}
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                  priority={i === 0}
                  className="block overflow-hidden rounded-sm bg-rubber"
                  imgClassName="aspect-[3/4] object-cover"
                />
                <p className="mt-4 text-sm text-slate">{t.role}</p>
                <h2 className="mt-1 text-2xl font-black tracking-tight">
                  {t.name}
                </h2>
                <p className="mt-1 text-slate">{t.specialties.join(" · ")}</p>
              </>
            ),
            details: (
              <>
                {t.bio.map((p) => (
                  <p key={p.slice(0, 32)} className="mb-4 text-lg">
                    {p}
                  </p>
                ))}
                <dl className="mt-8 grid gap-6 sm:grid-cols-2">
                  {t.certifications.length > 0 && (
                    <div>
                      <dt className="text-sm font-medium text-slate">
                        Qualifications
                      </dt>
                      <dd className="mt-1">{t.certifications.join(", ")}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-sm font-medium text-slate">Coaches</dt>
                    <dd className="mt-1">
                      <ul className="flex flex-wrap gap-x-4 gap-y-1">
                        {classesCoachedBy(t.slug).map((c) => (
                          <li key={c.slug}>
                            <Link
                              href={`/classes/${c.slug}`}
                              transitionTypes={navTransition.forward}
                              className="underline underline-offset-4"
                            >
                              {c.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </dd>
                  </div>
                </dl>
              </>
            ),
          }))}
        />
      </div>
    </PageTransition>
  );
}
