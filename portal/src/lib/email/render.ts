import "server-only";

import { render } from "@react-email/render";
import type { ReactElement } from "react";

/**
 * Convert a React Email component tree into the HTML + plain-text pair that
 * Resend wants. Use this in server actions / cron handlers before calling
 * `sendEmail`.
 */
export async function renderEmail(element: ReactElement): Promise<{
  html: string;
  text: string;
}> {
  const [html, text] = await Promise.all([
    render(element, { pretty: false }),
    render(element, { plainText: true }),
  ]);
  return { html, text };
}
