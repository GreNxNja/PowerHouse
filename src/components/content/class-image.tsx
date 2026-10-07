import { ViewTransition } from "react";
import { Picture } from "@/components/picture";
import type { GymClass } from "@/lib/schemas";
import { cn } from "@/lib/utils";

/**
 * The class photo, shared between the card and the detail page. Same `name`
 * on both sides, so navigating morphs one into the other (see .morph in
 * globals.css). `default="none"` keeps it still during unrelated transitions;
 * `share` must stay set alongside it or the pair silently stops morphing.
 */
export function ClassImage({
  item,
  sizes,
  priority,
  className,
}: {
  item: GymClass;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <ViewTransition name={`class-${item.slug}`} share="morph" default="none">
      <Picture
        src={item.image}
        alt={item.imageAlt}
        sizes={sizes}
        priority={priority}
        className={cn("block overflow-hidden rounded-sm bg-rubber", className)}
        imgClassName="aspect-[3/4] object-cover"
      />
    </ViewTransition>
  );
}
