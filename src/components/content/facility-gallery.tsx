import { Picture } from "@/components/picture";
import type { Gym } from "@/lib/schemas";

/**
 * Photos of the space: a lead image beside a 2×2 grid. On large screens the
 * lead stretches to the grid's height; everywhere else images are 4:3.
 * Static on purpose: Section 2 keeps non-triggered motion for the hero.
 */
export function FacilityGallery({ photos }: { photos: Gym["gallery"] }) {
  const [lead, ...rest] = photos;
  if (!lead) return null;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <figure className="flex flex-col">
        <Picture
          src={lead.image}
          alt={lead.alt}
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="block min-h-0 flex-1 overflow-hidden rounded-sm bg-rubber"
          imgClassName="aspect-[4/3] h-full object-cover lg:aspect-auto"
        />
        <figcaption className="mt-2 text-sm text-slate">
          {lead.caption}
        </figcaption>
      </figure>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-6">
        {rest.map((photo) => (
          <li key={photo.image}>
            <figure>
              <Picture
                src={photo.image}
                alt={photo.alt}
                sizes="(min-width: 1024px) 25vw, 50vw"
                className="block overflow-hidden rounded-sm bg-rubber"
                imgClassName="aspect-[4/3] object-cover"
              />
              <figcaption className="mt-2 text-sm text-slate">
                {photo.caption}
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </div>
  );
}
