"use client";

import { CheckIcon } from "lucide-react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";
import { useEffect, useId, useState } from "react";
import { duration, easeFluid } from "@/lib/animations";
import { formatPrice } from "@/lib/format";
import type { Plan } from "@/lib/schemas";
import { cn } from "@/lib/utils";

type Billing = "monthly" | "annual";

/** Counts to the new price. Screen readers only get the final value. */
function AnimatedPrice({
  value,
  format,
}: {
  value: number;
  format: (n: number) => string;
}) {
  const reduce = useReducedMotion();
  const mv = useMotionValue(value);
  const text = useTransform(mv, (v) => format(Math.round(v)));

  useEffect(() => {
    if (reduce) {
      mv.set(value);
      return;
    }
    const controls = animate(mv, value, {
      duration: duration.slow,
      ease: easeFluid,
    });
    return () => controls.stop();
  }, [value, reduce, mv]);

  return (
    <>
      <motion.span aria-hidden="true">{text}</motion.span>
      <span className="sr-only">{format(value)}</span>
    </>
  );
}

export function PlanPricing({
  plans,
  currency,
  locale,
}: {
  plans: Plan[];
  currency: string;
  locale: string;
}) {
  const [billing, setBilling] = useState<Billing>("monthly");
  const name = useId();
  const format = (n: number) => formatPrice(n, currency, locale);

  const maxSaving = Math.max(
    ...plans.map((p) => Math.round((1 - p.annualMonthly / p.monthly) * 100)),
  );
  const options: { value: Billing; label: string; note?: string }[] = [
    { value: "monthly", label: "Monthly" },
    { value: "annual", label: "Annual", note: `save up to ${maxSaving}%` },
  ];

  return (
    <div>
      <fieldset className="mb-8">
        <legend className="sr-only">Billing period</legend>
        <div className="inline-flex rounded-sm border border-input bg-card p-1">
          {options.map((o) => {
            const checked = billing === o.value;
            return (
              <label
                key={o.value}
                className={cn(
                  "relative isolate inline-flex h-11 cursor-pointer items-center gap-2 rounded-sm px-4 text-sm font-medium transition-colors duration-150",
                  "has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring",
                  checked
                    ? "text-background"
                    : "text-foreground hover:bg-muted",
                )}
              >
                <input
                  type="radio"
                  name={name}
                  value={o.value}
                  checked={checked}
                  onChange={() => setBilling(o.value)}
                  className="sr-only"
                />
                {checked && (
                  <motion.span
                    layoutId={`${name}-pill`}
                    aria-hidden="true"
                    className="absolute inset-0 -z-10 rounded-sm bg-foreground"
                    transition={{ duration: duration.base, ease: easeFluid }}
                  />
                )}
                {o.label}
                {o.note && (
                  <span
                    className={checked ? "text-background/75" : "text-slate"}
                  >
                    {o.note}
                  </span>
                )}
              </label>
            );
          })}
        </div>
      </fieldset>

      <ul className="grid gap-6 lg:grid-cols-3">
        {plans.map((plan) => {
          const perMonth =
            billing === "monthly" ? plan.monthly : plan.annualMonthly;
          return (
            <li
              key={plan.id}
              className={cn(
                "flex flex-col rounded-sm border p-6 sm:p-8",
                plan.highlighted
                  ? "surface-iron border-iron dark:border-primary"
                  : "bg-card",
              )}
            >
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="text-2xl font-extrabold tracking-tight">
                  {plan.name}
                </h2>
                {plan.highlighted && (
                  <span className="text-sm text-muted-foreground">
                    Most popular
                  </span>
                )}
              </div>
              <p className="mt-2 text-muted-foreground lg:min-h-[2lh]">
                {plan.summary}
              </p>
              <p className="mt-8">
                <span className="font-display text-5xl font-black tracking-tight tabular-nums">
                  <AnimatedPrice value={perMonth} format={format} />
                </span>
                <span className="text-muted-foreground"> a month</span>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {billing === "monthly"
                  ? "Billed monthly. Cancel with 30 days’ notice."
                  : `${format(plan.annualMonthly * 12)} billed once a year.`}
              </p>
              <ul className="mt-8 grid gap-3 border-t pt-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-3">
                    <CheckIcon
                      aria-hidden="true"
                      className="mt-1 size-4 shrink-0"
                    />
                    {f}
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
