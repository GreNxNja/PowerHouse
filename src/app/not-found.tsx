import Link from "next/link";
import { CtaLink } from "@/components/layout/cta-link";

export default function NotFound() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-32 sm:px-6">
      <p className="text-sm font-medium text-slate">404</p>
      <h1 className="mt-2 max-w-3xl text-4xl leading-[0.95] font-black tracking-tight sm:text-6xl">
        That page isn’t here.
      </h1>
      <p className="mt-6 max-w-prose text-lg text-slate">
        It may have moved, or the link may be wrong. Try the{" "}
        <Link href="/classes" className="underline underline-offset-4">
          class list
        </Link>{" "}
        or the{" "}
        <Link href="/timetable" className="underline underline-offset-4">
          timetable
        </Link>
        .
      </p>
      <CtaLink className="mt-10" />
    </section>
  );
}
