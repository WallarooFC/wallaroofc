import "server-only";

import { Resend } from "resend";

import { env } from "@/env";

let resend: Resend | null = null;
function client(): Resend {
  if (!resend) resend = new Resend(env.RESEND_API_KEY);
  return resend;
}

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
};

export type SendEmailResult =
  | { status: "sent"; id: string }
  | { status: "skipped"; reason: string }
  | { status: "failed"; error: string };

/**
 * Wraps Resend so the rest of the app can pretend "send an email" is a
 * single, predictable call. Failures are reported, not thrown -- a single
 * failed reminder shouldn't blow up the whole daily sweep.
 */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  if (!env.RESEND_API_KEY || env.RESEND_API_KEY.startsWith("placeholder")) {
    return { status: "skipped", reason: "RESEND_API_KEY not configured" };
  }
  const recipients = Array.isArray(input.to) ? input.to : [input.to];
  if (recipients.length === 0) {
    return { status: "skipped", reason: "no recipients" };
  }

  try {
    const result = await client().emails.send({
      from: env.RESEND_FROM_EMAIL,
      to: recipients,
      subject: input.subject,
      text: input.text,
      html: input.html,
      replyTo: input.replyTo,
    });
    if (result.error) {
      return { status: "failed", error: result.error.message ?? "Resend error" };
    }
    return { status: "sent", id: result.data?.id ?? "unknown" };
  } catch (err) {
    return { status: "failed", error: (err as Error).message };
  }
}
