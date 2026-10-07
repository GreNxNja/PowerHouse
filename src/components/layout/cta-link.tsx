import Link from "next/link";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

/** The primary conversion link. The only place the ultra accent fills a surface. */
export function CtaLink({
  className,
  children = site.cta.label,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <Link
      href={site.cta.href}
      data-cta
      className={cn(
        "inline-flex h-11 items-center justify-center rounded-sm bg-primary px-5 font-medium whitespace-nowrap text-primary-foreground",
        "transition-colors duration-150 hover:bg-primary/90",
        className,
      )}
    >
      {children}
    </Link>
  );
}
