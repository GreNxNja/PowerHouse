import type { Metadata } from "next";
import { PageHeader } from "@/components/content/page-header";
import { TrialForm } from "@/components/content/trial-form";
import { PageTransition } from "@/components/page-transition";
import { Picture } from "@/components/picture";
import { gym } from "@/content";
import { dayRange, formatTime } from "@/lib/format";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Contact",
  description:
    "Find PowerHouse, check opening hours and book a free first session with a coach.",
  card: "contact",
});

export default function ContactPage() {
  const { address, phone, email, whatsapp, hours, geo } = gym;

  return (
    <PageTransition>
      <PageHeader eyebrow="Contact" title="Come and lift with us.">
        <p>
          Book a free session below, or call, message or just walk in during
          opening hours.
        </p>
      </PageHeader>

      <div className="mx-auto grid max-w-7xl gap-16 px-4 pb-24 sm:px-6 lg:grid-cols-[1fr_1.4fr]">
        <div className="grid content-start gap-12">
          <section aria-labelledby="find-us">
            <h2 id="find-us" className="text-2xl font-extrabold tracking-tight">
              Find us
            </h2>
            <address className="mt-4 text-lg not-italic">
              {gym.name}
              <br />
              {address.street}
              <br />
              {[address.locality, address.region, address.postalCode]
                .filter(Boolean)
                .join(", ")}
            </address>
            {gym.exterior && (
              <figure className="mt-6">
                <Picture
                  src={gym.exterior.image}
                  alt={gym.exterior.alt}
                  sizes="(min-width: 1024px) 40vw, 100vw"
                  priority
                  className="block overflow-hidden rounded-sm bg-rubber"
                  imgClassName="aspect-video object-cover"
                />
                <figcaption className="mt-2 text-sm text-slate">
                  {gym.exterior.caption}
                </figcaption>
              </figure>
            )}
          </section>

          <section aria-labelledby="hours">
            <h2 id="hours" className="text-2xl font-extrabold tracking-tight">
              Opening hours
            </h2>
            <dl className="mt-4">
              {hours.map((h) => (
                <div
                  key={h.days.join()}
                  className="flex justify-between gap-4 border-b py-3"
                >
                  <dt>{dayRange(h.days)}</dt>
                  <dd className="text-slate tabular-nums">
                    {formatTime(h.opens, gym.locale)}–
                    {formatTime(h.closes, gym.locale)}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <section aria-labelledby="reach-us">
            <h2
              id="reach-us"
              className="text-2xl font-extrabold tracking-tight"
            >
              Get in touch
            </h2>
            <ul className="mt-4 grid gap-2 text-lg">
              <li>
                <a
                  href={`tel:${phone.e164}`}
                  className="underline underline-offset-4"
                >
                  Call {phone.display}
                </a>
              </li>
              <li>
                <a
                  href={`https://wa.me/${whatsapp}`}
                  className="underline underline-offset-4"
                  rel="noopener"
                >
                  Message us on WhatsApp
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${email}`}
                  className="underline underline-offset-4"
                >
                  {email}
                </a>
              </li>
            </ul>
          </section>
        </div>

        <div className="grid content-start gap-12">
          <section
            id="trial"
            aria-labelledby="trial-title"
            className="surface-iron scroll-mt-24 rounded-sm p-6 sm:p-10"
          >
            <h2
              id="trial-title"
              className="text-3xl font-black tracking-tight sm:text-4xl"
            >
              Book a free session
            </h2>
            <p className="mt-4 max-w-prose text-muted-foreground">
              About an hour with a coach: a look around, a chat about what you
              want from training, and a few lifts to find your starting point.
              No pressure to sign up on the day.
            </p>
            <TrialForm
              contact={{
                phoneDisplay: phone.display,
                phoneHref: `tel:${phone.e164}`,
                whatsappHref: `https://wa.me/${whatsapp}`,
              }}
            />
            <p className="mt-10 border-t pt-6 text-muted-foreground">
              Prefer to talk? Call{" "}
              <a
                href={`tel:${phone.e164}`}
                className="text-chalk underline underline-offset-4"
              >
                {phone.display}
              </a>{" "}
              or{" "}
              <a
                href={`https://wa.me/${whatsapp}`}
                className="text-chalk underline underline-offset-4"
                rel="noopener"
              >
                message us on WhatsApp
              </a>
              .
            </p>
          </section>

          {geo && (
            <iframe
              title={`Map showing ${gym.name}`}
              className="aspect-[4/3] w-full rounded-sm border"
              loading="lazy"
              referrerPolicy="no-referrer"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${geo.lng - 0.006}%2C${geo.lat - 0.004}%2C${geo.lng + 0.006}%2C${geo.lat + 0.004}&layer=mapnik&marker=${geo.lat}%2C${geo.lng}`}
            />
          )}
        </div>
      </div>
    </PageTransition>
  );
}
