import type { Metadata } from "next";
import { gym } from "@/content";

/** "en-IN" -> "en_IN", the form Open Graph expects. */
const ogLocale = gym.locale.replace("-", "_");

/**
 * Per-page metadata with its Open Graph card (public/og/<card>.jpg, made by
 * `npm run og`). Next replaces `openGraph` wholesale rather than merging it
 * with the layout's, so every field is set here, not just the image.
 *
 * `title` is the short page title; the layout template adds "| PowerHouse".
 */
export function pageMetadata({
  title,
  description,
  card,
}: {
  title?: string;
  description: string;
  card: string;
}): Metadata {
  const fullTitle = title
    ? `${title} | ${gym.name}`
    : `${gym.name} | ${gym.tagline}`;
  const image = {
    url: `/og/${card}.jpg`,
    width: 1200,
    height: 630,
    alt: fullTitle,
  };
  return {
    ...(title ? { title } : {}),
    description,
    openGraph: {
      type: "website",
      siteName: gym.name,
      locale: ogLocale,
      title: fullTitle,
      description,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [image.url],
    },
  };
}
