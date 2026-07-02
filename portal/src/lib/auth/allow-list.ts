import "server-only";

import { env } from "@/env";

export function isAllowListed(email: string): boolean {
  return env.ALLOW_LIST_EMAILS.includes(email.trim().toLowerCase());
}
