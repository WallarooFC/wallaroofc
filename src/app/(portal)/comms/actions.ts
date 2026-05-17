"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { recordActivity } from "@/lib/audit";
import { listSegmentRecipients, renderTemplate } from "@/lib/db/comms";
import { sendEmail } from "@/lib/email/send";

const composeSchema = z.object({
  segment: z.enum([
    "all",
    "all_with_email",
    "life",
    "playing",
    "sponsors",
    "gold_sponsors",
    "paid_2026",
    "unpaid_2026",
    "vip",
  ]),
  subject: z.string().trim().min(1).max(200),
  body_markdown: z.string().trim().min(1).max(20_000),
});

export type ComposeState =
  | { status: "idle" }
  | {
      status: "sent";
      sent: number;
      skipped: number;
      failed: number;
      sample: string;
    }
  | { status: "error"; message: string; fieldErrors?: Record<string, string> };

function blankToNull(value: FormDataEntryValue | null): string | null {
  if (value === null) return null;
  const str = String(value).trim();
  return str === "" ? null : str;
}

export async function sendMailMerge(
  _prev: ComposeState | undefined,
  formData: FormData,
): Promise<ComposeState> {
  const parsed = composeSchema.safeParse({
    segment: blankToNull(formData.get("segment")) ?? "all",
    subject: blankToNull(formData.get("subject")) ?? "",
    body_markdown: blankToNull(formData.get("body_markdown")) ?? "",
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path.join(".");
      if (path && !fieldErrors[path]) fieldErrors[path] = issue.message;
    }
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors,
    };
  }

  const recipients = await listSegmentRecipients(parsed.data.segment);
  const targets = recipients.filter((r) => !!r.email);

  let sent = 0;
  let skipped = recipients.length - targets.length;
  let failed = 0;
  let sample = "";

  for (const recipient of targets) {
    const vars = {
      first_name: recipient.first_name,
      last_name: recipient.last_name,
      full_name: `${recipient.first_name} ${recipient.last_name}`.trim(),
    };
    const body = renderTemplate(parsed.data.body_markdown, vars);
    const subject = renderTemplate(parsed.data.subject, vars);
    if (!sample) sample = body.slice(0, 200);
    const result = await sendEmail({
      to: recipient.email!,
      subject,
      text: body,
    });
    if (result.status === "sent") sent += 1;
    else if (result.status === "skipped") skipped += 1;
    else failed += 1;
  }

  await recordActivity({
    entity_table: "comms",
    entity_id: null,
    action: "mail_merge",
    diff: {
      segment: parsed.data.segment,
      subject: parsed.data.subject,
      total: recipients.length,
      with_email: targets.length,
      sent,
      skipped,
      failed,
    },
  });

  revalidatePath("/comms");

  return {
    status: "sent",
    sent,
    skipped,
    failed,
    sample,
  };
}
