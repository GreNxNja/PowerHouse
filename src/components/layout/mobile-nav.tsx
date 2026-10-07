"use client";

import { MenuIcon } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useLenis } from "@/components/motion-provider";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { duration, easeFluid, navTransition } from "@/lib/animations";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";
import { CtaLink } from "./cta-link";
import { isActive } from "./nav-links";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const lenis = useLenis();

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    // Lenis would keep smoothing the page behind the modal.
    if (next) lenis?.stop();
    else lenis?.start();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger
        className="inline-flex size-11 items-center justify-center rounded-sm text-foreground lg:hidden"
        aria-label="Open menu"
      >
        <MenuIcon aria-hidden="true" className="size-6" />
      </SheetTrigger>
      <SheetContent side="right" className="gap-0 p-6 pt-16">
        <SheetTitle className="sr-only">Menu</SheetTitle>
        <SheetDescription className="sr-only">Site navigation</SheetDescription>
        <nav aria-label="Mobile">
          <ul className="flex flex-col">
            {site.nav.map((item, i) => {
              const active = isActive(pathname, item.href);
              return (
                // The popup mounts on open, so links enter on every open.
                // MotionConfig reducedMotion="user" drops the slide, keeps the fade.
                <motion.li
                  key={item.href}
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    duration: duration.slow,
                    ease: easeFluid,
                    delay: 0.08 + i * 0.045,
                  }}
                >
                  <Link
                    href={item.href}
                    transitionTypes={navTransition.lateral}
                    aria-current={active ? "page" : undefined}
                    onClick={() => onOpenChange(false)}
                    className={cn(
                      "block py-3 font-display text-2xl font-extrabold [font-stretch:125%]",
                      !active && "text-slate",
                    )}
                  >
                    {item.label}
                  </Link>
                </motion.li>
              );
            })}
          </ul>
        </nav>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: duration.base,
            delay: 0.08 + site.nav.length * 0.045,
          }}
        >
          <CtaLink className="mt-8 w-full" />
        </motion.div>
      </SheetContent>
    </Sheet>
  );
}
