"use client";

import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { MotionConfig } from "motion/react";
import { createContext, useContext, useEffect, useState } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

const LenisContext = createContext<Lenis | null>(null);

/** The active Lenis instance, or null when reduced motion is on (native scroll). */
export function useLenis() {
  return useContext(LenisContext);
}

export function MotionProvider({ children }: { children: React.ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let instance: Lenis | null = null;
    const tick = (time: number) => instance?.raf(time * 1000);

    const start = () => {
      instance = new Lenis({ lerp: 0.1, smoothWheel: true, autoRaf: false });
      instance.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
      setLenis(instance);
    };

    const stop = () => {
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33); // GSAP defaults
      instance?.destroy();
      instance = null;
      setLenis(null);
    };

    // Follow the OS setting live, not just on first load.
    const sync = () => {
      stop();
      if (!reduced.matches) start();
    };

    sync();
    reduced.addEventListener("change", sync);
    return () => {
      reduced.removeEventListener("change", sync);
      stop();
    };
  }, []);

  return (
    <LenisContext value={lenis}>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LenisContext>
  );
}
