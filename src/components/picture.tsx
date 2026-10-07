import { images } from "@/content";
import { cn } from "@/lib/utils";

type PictureProps = {
  /** Key from the image manifest, e.g. "classes/engine". */
  src: string;
  alt: string;
  /** Rendered width hint for the browser, e.g. "(min-width: 768px) 33vw, 100vw". */
  sizes: string;
  /** Only for the LCP image: eager, high fetch priority. Everything else is lazy. */
  priority?: boolean;
  className?: string;
  imgClassName?: string;
  imgStyle?: React.CSSProperties;
};

const srcSet = (src: string, widths: number[], ext: string) =>
  widths.map((w) => `/img/${src}-${w}.${ext} ${w}w`).join(", ");

/**
 * Pre-optimized responsive image (see scripts/optimize-images.ts). Width and
 * height come from the manifest, so the browser reserves space and nothing shifts.
 */
export function Picture({
  src,
  alt,
  sizes,
  priority = false,
  className,
  imgClassName,
  imgStyle,
}: PictureProps) {
  const entry = images[src];
  if (!entry) throw new Error(`Unknown image "${src}". Run npm run images.`);
  const fallback = entry.widths[entry.widths.length - 1];

  return (
    <picture className={className}>
      <source
        type="image/avif"
        srcSet={srcSet(src, entry.widths, "avif")}
        sizes={sizes}
      />
      <source
        type="image/webp"
        srcSet={srcSet(src, entry.widths, "webp")}
        sizes={sizes}
      />
      <img
        src={`/img/${src}-${fallback}.webp`}
        alt={alt}
        width={entry.width}
        height={entry.height}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding={priority ? "sync" : "async"}
        className={cn("h-auto w-full", imgClassName)}
        style={imgStyle}
      />
    </picture>
  );
}
