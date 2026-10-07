"use client";

import { motion, useReducedMotion, useSpring } from "motion/react";
import { useEffect, useState } from "react";

const spring = { stiffness: 260, damping: 18, mass: 0.6 };

/**
 * Pulls its child a few pixels toward the cursor. Mouse/trackpad only (fine
 * pointer with hover), never touch, and off under reduced motion. Keyboard
 * focus and clicks are untouched: only a transform changes.
 *
 * The negative margin + padding widens the pull zone without moving layout.
 */
export function Magnetic({
  children,
  strength = 0.3,
  max = 10,
}: {
  children: React.ReactNode;
  strength?: number;
  max?: number;
}) {
  const reduce = useReducedMotion();
  const [finePointer, setFinePointer] = useState(false);
  const x = useSpring(0, spring);
  const y = useSpring(0, spring);

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setFinePointer(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const active = finePointer && !reduce;
  const clamp = (v: number) => Math.max(-max, Math.min(max, v));

  return (
    <motion.span
      className="-m-4 inline-block p-4"
      style={active ? { x, y } : undefined}
      onPointerMove={(e) => {
        if (!active || e.pointerType !== "mouse") return;
        const r = e.currentTarget.getBoundingClientRect();
        x.set(clamp((e.clientX - (r.left + r.width / 2)) * strength));
        y.set(clamp((e.clientY - (r.top + r.height / 2)) * strength));
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.span>
  );
}
