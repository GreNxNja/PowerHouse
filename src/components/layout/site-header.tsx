import Link from "next/link";
import { navTransition } from "@/lib/animations";
import { site } from "@/lib/site";
import { CtaLink } from "./cta-link";
import { MobileNav } from "./mobile-nav";
import { NavLinks } from "./nav-links";
import { ThemeToggle } from "./theme-toggle";

export function SiteHeader() {
  return (
    <header
      // Named so page transitions leave it in place (see globals.css).
      style={{ viewTransitionName: "site-header" }}
      className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur-sm"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6">
        <Link
          href="/"
          transitionTypes={navTransition.lateral}
          className="font-display text-lg font-black tracking-tight [font-stretch:125%]"
        >
          {site.name}
        </Link>
        <nav aria-label="Main" className="hidden lg:block">
          <NavLinks />
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <CtaLink className="hidden sm:inline-flex" />
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
