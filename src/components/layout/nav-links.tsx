"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navTransition } from "@/lib/animations";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

export function isActive(pathname: string, href: string) {
  const path = pathname.replace(/\/$/, "") || "/";
  return path === href || path.startsWith(`${href}/`);
}

export function NavLinks({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <ul className={cn("flex items-center gap-1", className)}>
      {site.nav.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              transitionTypes={navTransition.lateral}
              aria-current={active ? "page" : undefined}
              className={cn(
                "rounded-sm px-3 py-2 text-sm text-slate transition-colors duration-150 hover:text-foreground",
                active &&
                  "text-foreground underline decoration-2 underline-offset-8",
              )}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
