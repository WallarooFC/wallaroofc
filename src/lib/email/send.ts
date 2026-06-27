import "server-only";

import { Resend } from "resend";
import type { ReactElement } from "react";

import { env } from "@/env";

import { renderEmail } from "./render";

let cachedClient: Resend | null = null;

function getResendClient(): Resend {
  if (!cachedClient) {
    cachedClient = new Resend(env.RESEND_API_KEY);
  }
  return cachedClient;
}

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  /** A rendered React Email component (typically a <Letter ...>). */
  template: ReactElement;
  /** Optional override; defaults to RESEND_FROM_EMAIL from env. */
  from?: string;
  /** Optional reply-to override. */
  replyTo?: string | string[];
};

/**
 * Send an email through Resend. Every send goes through this wrapper so it
 * can be batched, rate-limited, and audited (the audit log write lands in
 * commit 7+).
 */
export async function sendEmail(input: SendEmailInput) {
  const { html, text } = await renderEmail(input.template);
  const client = getResendClient();

  return client.emails.send({
    from: input.from ?? env.RESEND_FROM_EMAIL,
    to: input.to,
    subject: input.subject,
    html,
    text,
    replyTo: input.replyTo,
  });
}
