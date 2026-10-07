import { z } from "zod";

/**
 * Free-session booking form. Shared by the client form and its tests.
 * Kept apart from the content schemas so the client bundle only pulls this in.
 */

export const preferredTimes = [
  { value: "early", label: "Early morning, before 9 AM" },
  { value: "midday", label: "Midday" },
  { value: "evening", label: "Evening, after 5 PM" },
  { value: "weekend", label: "Weekend" },
] as const;

export const experienceLevels = [
  { value: "new", label: "New to lifting" },
  { value: "some", label: "Some experience" },
  { value: "regular", label: "I lift regularly" },
] as const;

const values = <T extends readonly { value: string }[]>(list: T) =>
  list.map((o) => o.value) as [T[number]["value"], ...T[number]["value"][]];

export const trialFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Enter your name so the coach knows who to look for.")
    .max(80, "Keep your name under 80 characters."),
  email: z
    .string()
    .trim()
    .min(1, "Enter your email so we can confirm a time.")
    .pipe(
      z.email(
        "Check your email address. It should look like name@example.com.",
      ),
    ),
  phone: z
    .string()
    .trim()
    .max(30, "That phone number looks too long.")
    .refine((v) => v === "" || /^[+\d][\d\s().-]{6,}$/.test(v), {
      message: "Check your phone number, or leave it blank.",
    }),
  preferredTime: z.enum(values(preferredTimes), {
    error: "Pick a time that usually suits you.",
  }),
  experience: z.enum(values(experienceLevels), {
    error: "Pick the option closest to you.",
  }),
  message: z.string().trim().max(1000, "Keep this under 1,000 characters."),
  /** Honeypot. Hidden from people; bots fill it. Web3Forms drops these. */
  botcheck: z.boolean(),
});

export type TrialFormValues = z.infer<typeof trialFormSchema>;
export type TrialFormInput = z.input<typeof trialFormSchema>;

export const trialFormDefaults: TrialFormInput = {
  name: "",
  email: "",
  phone: "",
  // Unset until chosen; the enum check reports it.
  preferredTime: "" as TrialFormInput["preferredTime"],
  experience: "" as TrialFormInput["experience"],
  message: "",
  botcheck: false,
};

const labelOf = (
  list: readonly { value: string; label: string }[],
  value: string,
) => list.find((o) => o.value === value)?.label ?? value;

/** The JSON body Web3Forms expects. Readable labels, so the gym's email reads well. */
export function toWeb3FormsPayload(values: TrialFormValues, accessKey: string) {
  return {
    access_key: accessKey,
    subject: `Free session request: ${values.name}`,
    from_name: "PowerHouse website",
    name: values.name,
    email: values.email,
    phone: values.phone || "Not given",
    "Preferred time": labelOf(preferredTimes, values.preferredTime),
    Experience: labelOf(experienceLevels, values.experience),
    message: values.message || "No message",
    botcheck: values.botcheck,
  };
}
