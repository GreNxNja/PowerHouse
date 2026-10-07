import type { Metadata } from "next";
import { ClassBrowser } from "@/components/content/class-browser";
import { ClassCard } from "@/components/content/class-card";
import { PageHeader } from "@/components/content/page-header";
import { PageTransition } from "@/components/page-transition";
import { categoriesInUse, classes } from "@/content";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Classes",
  description:
    "Coached strength, Olympic lifting, conditioning and mobility classes, from complete beginner to competition prep.",
  card: "classes",
});

export default function ClassesPage() {
  return (
    <PageTransition>
      <PageHeader eyebrow="Classes" title="Every class is coached.">
        <p>
          Small groups, a written plan and a coach who knows your numbers. New
          to lifting? Start with Strength foundations.
        </p>
      </PageHeader>
      <section
        aria-label="Class list"
        className="mx-auto max-w-7xl px-4 pb-24 sm:px-6"
      >
        <ClassBrowser
          categories={categoriesInUse}
          items={classes.map((c) => ({
            slug: c.slug,
            category: c.category,
            card: <ClassCard item={c} />,
          }))}
        />
      </section>
    </PageTransition>
  );
}
