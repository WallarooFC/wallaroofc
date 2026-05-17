import "server-only";

import twilio from "twilio";

import { env } from "@/env";

let cached: ReturnType<typeof twilio> | null = null;
function client() {
  if (!cached) {
    if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN) {
      throw new Error("Twilio credentials missing");
    }
    cached = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
  }
  return cached;
}

export type SmsResult =
  | { status: "sent"; sid: string }
  | { status: "skipped"; reason: string }
  | { status: "failed"; error: string };

/**
 * Normalise an Australian phone to E.164. Accepts "04XX XXX XXX" or
 * "+614XXXXXXXX"; returns null on unrecognised shapes so the caller can
 * skip without bothering Twilio.
 */
export function toE164AU(raw: string | null): string | null {
  if (!raw) return null;
  const digits = raw.replace(/[^\d+]/gu, "");
  if (digits.startsWith("+61") && (digits.length === 11 || digits.length === 12)) {
    return digits;
  }
  if (digits.startsWith("61") && (digits.length === 11 || digits.length === 12)) {
    return `+${digits}`;
  }
  if (digits.startsWith("0") && digits.length === 10) {
    return `+61${digits.slice(1)}`;
  }
  return null;
}

export async function sendSms({
  to,
  body,
}: {
  to: string;
  body: string;
}): Promise<SmsResult> {
  if (!env.SMS_ENABLED) {
    return { status: "skipped", reason: "SMS_ENABLED is false" };
  }
  if (!env.TWILIO_FROM_NUMBER) {
    return { status: "skipped", reason: "TWILIO_FROM_NUMBER not configured" };
  }
  try {
    const message = await client().messages.create({
      from: env.TWILIO_FROM_NUMBER,
      to,
      body,
    });
    return { status: "sent", sid: message.sid };
  } catch (err) {
    return { status: "failed", error: (err as Error).message };
  }
}
