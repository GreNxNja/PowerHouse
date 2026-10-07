"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useId, useRef, useState } from "react";
import { type FieldError, useForm } from "react-hook-form";
import { track } from "@/lib/analytics";
import {
  experienceLevels,
  preferredTimes,
  type TrialFormInput,
  type TrialFormValues,
  toWeb3FormsPayload,
  trialFormDefaults,
  trialFormSchema,
} from "@/lib/trial-form";
import { cn } from "@/lib/utils";

const ENDPOINT = "https://api.web3forms.com/submit";
// Public by design: Web3Forms keys are meant for client-side use.
const ACCESS_KEY = process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY ?? "";

type ErrorReason = "network" | "rate" | "rejected" | "unconfigured";
type Status =
  | { kind: "idle" }
  | { kind: "sent"; firstName: string }
  | { kind: "error"; reason: ErrorReason };

type Contact = {
  phoneDisplay: string;
  phoneHref: string;
  whatsappHref: string;
};

const inputClass =
  "block h-12 w-full rounded-sm border-2 border-transparent bg-chalk px-3 text-base text-iron placeholder:text-slate aria-invalid:border-destructive dark:border-input dark:bg-muted dark:text-foreground";
// Evening: dark fields instead of glaring chalk ones. Border 3.7:1, text 12.5:1, placeholder 6.4:1.

function FieldMessage({ id, error }: { id: string; error?: FieldError }) {
  if (!error?.message) return null;
  return (
    <p id={id} className="mt-2 text-sm text-destructive">
      {error.message}
    </p>
  );
}

export function TrialForm({ contact }: { contact: Contact }) {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const started = useRef(false);
  const successRef = useRef<HTMLHeadingElement>(null);
  const uid = useId();
  const ids = (name: string) => ({
    field: `${uid}-${name}`,
    error: `${uid}-${name}-error`,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TrialFormInput, unknown, TrialFormValues>({
    resolver: zodResolver(trialFormSchema),
    defaultValues: trialFormDefaults,
    mode: "onTouched",
  });

  // Success replaces the form, so move focus to the confirmation.
  useEffect(() => {
    if (status.kind === "sent") successRef.current?.focus();
  }, [status.kind]);

  const onSubmit = async (values: TrialFormValues) => {
    if (!ACCESS_KEY) {
      setStatus({ kind: "error", reason: "unconfigured" });
      return;
    }
    setStatus({ kind: "idle" });
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(toWeb3FormsPayload(values, ACCESS_KEY)),
      });
      const data: unknown = await res.json().catch(() => null);
      const ok =
        res.ok &&
        typeof data === "object" &&
        data !== null &&
        "success" in data &&
        data.success === true;
      if (ok) {
        track("Trial form submit", {
          experience: values.experience,
          time: values.preferredTime,
        });
        setStatus({
          kind: "sent",
          firstName: values.name.split(/\s+/)[0] ?? values.name,
        });
        reset();
        started.current = false;
        return;
      }
      const reason: ErrorReason = res.status === 429 ? "rate" : "rejected";
      track("Trial form error", { reason });
      setStatus({ kind: "error", reason });
    } catch {
      track("Trial form error", { reason: "network" });
      setStatus({ kind: "error", reason: "network" });
    }
  };

  if (status.kind === "sent") {
    return (
      <div className="mt-8">
        <h3
          ref={successRef}
          tabIndex={-1}
          className="text-2xl font-extrabold tracking-tight outline-none"
        >
          Thanks, {status.firstName}. Your request is in.
        </h3>
        <p className="mt-3 max-w-prose text-muted-foreground">
          A coach will email or call within one working day to confirm a time.
          Need it sooner? Call{" "}
          <a
            href={contact.phoneHref}
            className="text-chalk underline underline-offset-4"
          >
            {contact.phoneDisplay}
          </a>
          .
        </p>
        <button
          type="button"
          onClick={() => setStatus({ kind: "idle" })}
          className="mt-6 inline-flex h-11 items-center rounded-sm border border-chalk/40 px-4 text-sm font-medium transition-colors duration-150 hover:bg-chalk/10"
        >
          Book for someone else
        </button>
      </div>
    );
  }

  const errorText: Record<ErrorReason, string> = {
    network:
      "We couldn’t send your request. Check your connection and try again.",
    rate: "Too many requests from this connection. Wait a minute, then try again.",
    rejected:
      "Something went wrong on our side and your request wasn’t sent. Please try again.",
    unconfigured: "Online booking isn’t switched on yet.",
  };

  const name = ids("name");
  const email = ids("email");
  const phone = ids("phone");
  const time = ids("time");
  const experience = ids("experience");
  const message = ids("message");

  return (
    <form
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      onFocusCapture={() => {
        if (started.current) return;
        started.current = true;
        track("Trial form start");
      }}
      className="mt-8 grid gap-6"
      aria-describedby={`${uid}-privacy`}
    >
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor={name.field} className="mb-2 block font-medium">
            Your name
          </label>
          <input
            id={name.field}
            type="text"
            autoComplete="name"
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? name.error : undefined}
            className={inputClass}
            {...register("name")}
          />
          <FieldMessage id={name.error} error={errors.name} />
        </div>
        <div>
          <label htmlFor={email.field} className="mb-2 block font-medium">
            Email
          </label>
          <input
            id={email.field}
            type="email"
            autoComplete="email"
            inputMode="email"
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? email.error : undefined}
            className={inputClass}
            {...register("email")}
          />
          <FieldMessage id={email.error} error={errors.email} />
        </div>
      </div>

      <div>
        <label htmlFor={phone.field} className="mb-2 block font-medium">
          Phone{" "}
          <span className="font-normal text-muted-foreground">
            (optional, if you’d rather we call)
          </span>
        </label>
        <input
          id={phone.field}
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          aria-invalid={errors.phone ? true : undefined}
          aria-describedby={errors.phone ? phone.error : undefined}
          className={cn(inputClass, "sm:max-w-xs")}
          {...register("phone")}
        />
        <FieldMessage id={phone.error} error={errors.phone} />
      </div>

      {(
        [
          ["preferredTime", time, "When suits you best?", preferredTimes],
          [
            "experience",
            experience,
            "How much lifting have you done?",
            experienceLevels,
          ],
        ] as const
      ).map(([field, fieldIds, legend, options]) => (
        <fieldset
          key={field}
          aria-describedby={errors[field] ? fieldIds.error : undefined}
        >
          <legend className="mb-2 font-medium">{legend}</legend>
          <div className="flex flex-wrap gap-2">
            {options.map((o) => (
              <label
                key={o.value}
                className={cn(
                  "inline-flex min-h-11 cursor-pointer items-center rounded-sm border-2 border-chalk/30 px-4 text-sm font-medium transition-colors duration-150 hover:border-chalk/60",
                  "has-checked:border-chalk has-checked:bg-chalk has-checked:text-iron",
                  "has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring",
                  errors[field] && "border-destructive",
                )}
              >
                <input
                  type="radio"
                  value={o.value}
                  className="sr-only"
                  aria-invalid={errors[field] ? true : undefined}
                  {...register(field)}
                />
                {o.label}
              </label>
            ))}
          </div>
          <FieldMessage id={fieldIds.error} error={errors[field]} />
        </fieldset>
      ))}

      <div>
        <label htmlFor={message.field} className="mb-2 block font-medium">
          Anything we should know?{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <textarea
          id={message.field}
          rows={4}
          placeholder="Goals, injuries, or the lift you most want to learn"
          aria-invalid={errors.message ? true : undefined}
          aria-describedby={errors.message ? message.error : undefined}
          className={cn(inputClass, "h-auto py-3")}
          {...register("message")}
        />
        <FieldMessage id={message.error} error={errors.message} />
      </div>

      {/* Honeypot: hidden from people and assistive tech. Web3Forms rejects it when ticked. */}
      <input
        type="checkbox"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
        {...register("botcheck")}
      />

      {status.kind === "error" && (
        <div
          role="alert"
          className="rounded-sm border-2 border-destructive p-4"
        >
          <p className="font-medium text-destructive">
            {errorText[status.reason]}
          </p>
          <p className="mt-1 text-muted-foreground">
            You can also book by calling{" "}
            <a
              href={contact.phoneHref}
              className="text-chalk underline underline-offset-4"
            >
              {contact.phoneDisplay}
            </a>{" "}
            or{" "}
            <a
              href={contact.whatsappHref}
              rel="noopener"
              className="text-chalk underline underline-offset-4"
            >
              messaging us on WhatsApp
            </a>
            .
          </p>
        </div>
      )}

      <div>
        <button
          type="submit"
          data-cta
          disabled={isSubmitting}
          aria-disabled={isSubmitting}
          className="inline-flex h-12 items-center justify-center rounded-sm bg-primary px-6 text-base font-medium text-primary-foreground transition-colors duration-150 hover:bg-primary/90 disabled:cursor-progress disabled:opacity-70"
        >
          {isSubmitting ? "Sending your request…" : "Book my free session"}
        </button>
        <p
          id={`${uid}-privacy`}
          className="mt-4 max-w-prose text-sm text-muted-foreground"
        >
          We only use your details to arrange your free session: no mailing
          list, no sharing. Your request reaches our inbox through Web3Forms.
        </p>
      </div>
    </form>
  );
}
