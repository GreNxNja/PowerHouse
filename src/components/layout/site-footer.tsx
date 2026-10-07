import Link from "next/link";
import { navTransition } from "@/lib/animations";
import { site } from "@/lib/site";
import { CtaLink } from "./cta-link";

export function SiteFooter() {
  return (
    <footer className="surface-iron">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 md:grid-cols-[2fr_1fr]">
        <div className="max-w-prose">
          <p className="font-display text-3xl font-black tracking-tight [font-stretch:125%] sm:text-4xl">
            Your first session is on us.
          </p>
          <p className="mt-4 text-muted-foreground">
            A coach walks you through the floor, checks how you move and builds
            a starting plan with you.
          </p>
          <CtaLink className="mt-8" />
        </div>
        <nav aria-label="Footer">
          <ul className="grid gap-2">
            {site.nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  transitionTypes={navTransition.lateral}
                  className="text-muted-foreground transition-colors duration-150 hover:text-chalk"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="border-t">
        <p className="mx-auto max-w-7xl px-4 py-6 text-sm text-muted-foreground sm:px-6">
          © {new Date().getFullYear()} {site.name}
        </p>
      </div>
    </footer>
  );
}
