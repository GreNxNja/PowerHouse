import { CheckIcon, MinusIcon } from "lucide-react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/content/page-header";
import { PlanPricing } from "@/components/content/plan-pricing";
import { CtaLink } from "@/components/layout/cta-link";
import { PageTransition } from "@/components/page-transition";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { gym, membership } from "@/content";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Membership",
  description:
    "Open gym, coached and unlimited plans. Monthly or annual, with a free first session on every plan.",
  card: "membership",
});

export default function MembershipPage() {
  const { plans, comparison, notes, faqs } = membership;

  return (
    <PageTransition>
      <PageHeader eyebrow="Membership" title="Pick how much coaching you want.">
        <p>
          Every plan starts with a free session and includes the full gym.
          Annual plans work out cheaper per month.
        </p>
      </PageHeader>

      <section aria-label="Plans" className="mx-auto max-w-7xl px-4 sm:px-6">
        <PlanPricing
          plans={plans}
          currency={gym.currency}
          locale={gym.locale}
        />
        <ul className="mt-6 grid gap-1 text-sm text-slate">
          {notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      </section>

      <section
        aria-labelledby="compare"
        className="mx-auto max-w-7xl px-4 pt-24 sm:px-6"
      >
        <h2 id="compare" className="text-3xl font-black tracking-tight">
          Compare plans
        </h2>
        {/* Scrollable on small screens, so it must be reachable by keyboard. */}
        <section
          className="relative mt-8 overflow-x-auto"
          // biome-ignore lint/a11y/noNoninteractiveTabindex: scroll container needs keyboard access
          tabIndex={0}
          aria-labelledby="compare"
        >
          <table className="w-full min-w-xl text-left">
            <thead>
              <tr className="border-b-2 border-foreground">
                <th scope="col" className="py-3 pr-4">
                  <span className="sr-only">Feature</span>
                </th>
                {plans.map((p) => (
                  <th
                    key={p.id}
                    scope="col"
                    className="px-4 py-3 font-display font-extrabold"
                  >
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparison.map((row) => (
                <tr key={row.feature} className="border-b">
                  <th scope="row" className="py-3 pr-4 font-normal">
                    {row.feature}
                  </th>
                  {plans.map((p) => {
                    const v = row.values[p.id];
                    return (
                      <td key={p.id} className="px-4 py-3">
                        {v === true ? (
                          <>
                            <CheckIcon aria-hidden="true" className="size-4" />
                            <span className="sr-only">Included</span>
                          </>
                        ) : v === false ? (
                          <>
                            <MinusIcon
                              aria-hidden="true"
                              className="size-4 text-slate"
                            />
                            <span className="sr-only">Not included</span>
                          </>
                        ) : (
                          v
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </section>

      <section
        aria-labelledby="faqs"
        className="mx-auto grid max-w-7xl gap-8 px-4 py-24 sm:px-6 lg:grid-cols-[1fr_2fr]"
      >
        <div>
          <h2 id="faqs" className="text-3xl font-black tracking-tight">
            Questions
          </h2>
          <p className="mt-4 max-w-sm text-slate">
            Anything else, ask us during your free session.
          </p>
          <CtaLink className="mt-6" />
        </div>
        <Accordion className="border-t">
          {faqs.map((f) => (
            <AccordionItem
              key={f.question}
              value={f.question}
              className="border-b"
            >
              <AccordionTrigger className="py-4 text-base">
                {f.question}
              </AccordionTrigger>
              <AccordionContent className="max-w-prose pb-4 text-slate">
                {f.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </PageTransition>
  );
}
