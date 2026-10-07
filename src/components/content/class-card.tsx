import Link from "next/link";
import { ClassImage } from "@/components/content/class-image";
import { navTransition } from "@/lib/animations";
import { categoryLabel, levelLabel } from "@/lib/format";
import type { GymClass } from "@/lib/schemas";

export function ClassCard({ item }: { item: GymClass }) {
  return (
    <article className="group relative flex h-full flex-col">
      <ClassImage
        item={item}
        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
      />
      <p className="mt-4 text-sm text-slate">
        {categoryLabel(item.category)} · {levelLabel(item.level)} ·{" "}
        {item.durationMinutes} min
      </p>
      <h3 className="mt-1 text-xl font-extrabold tracking-tight">
        <Link
          href={`/classes/${item.slug}`}
          transitionTypes={navTransition.forward}
          // The whole card is clickable; the link text stays the accessible name.
          className="after:absolute after:inset-0 group-hover:underline"
        >
          {item.name}
        </Link>
      </h3>
      <p className="mt-2 text-slate">{item.summary}</p>
    </article>
  );
}
