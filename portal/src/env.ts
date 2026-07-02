import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    RESEND_API_KEY: z.string().min(1),
    RESEND_FROM_EMAIL: z.string().email(),
    RESEND_INBOUND_SECRET: z.string().min(1),
    SMS_ENABLED: z
      .enum(["true", "false"])
      .default("false")
      .transform((value) => value === "true"),
    TWILIO_ACCOUNT_SID: z.string().optional(),
    TWILIO_AUTH_TOKEN: z.string().optional(),
    TWILIO_FROM_NUMBER: z.string().optional(),
    CRON_SECRET: z.string().min(16),
    MICROSOFT_OAUTH_CLIENT_ID: z.string().min(1),
    MICROSOFT_OAUTH_CLIENT_SECRET: z.string().min(1),
    MICROSOFT_OAUTH_TENANT_ID: z.string().min(1).default("common"),
    ALLOW_LIST_EMAILS: z
      .string()
      .min(1)
      .transform((value) =>
        value
          .split(",")
          .map((email) => email.trim().toLowerCase())
          .filter(Boolean),
      ),
  },
  client: {
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
    NEXT_PUBLIC_PORTAL_URL: z.string().url(),
    NEXT_PUBLIC_PUBLIC_SITE_URL: z.string().url(),
  },
  runtimeEnv: {
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
    RESEND_INBOUND_SECRET: process.env.RESEND_INBOUND_SECRET,
    SMS_ENABLED: process.env.SMS_ENABLED,
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
    TWILIO_FROM_NUMBER: process.env.TWILIO_FROM_NUMBER,
    CRON_SECRET: process.env.CRON_SECRET,
    MICROSOFT_OAUTH_CLIENT_ID: process.env.MICROSOFT_OAUTH_CLIENT_ID,
    MICROSOFT_OAUTH_CLIENT_SECRET: process.env.MICROSOFT_OAUTH_CLIENT_SECRET,
    MICROSOFT_OAUTH_TENANT_ID: process.env.MICROSOFT_OAUTH_TENANT_ID,
    ALLOW_LIST_EMAILS: process.env.ALLOW_LIST_EMAILS,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_PORTAL_URL: process.env.NEXT_PUBLIC_PORTAL_URL,
    NEXT_PUBLIC_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_PUBLIC_SITE_URL,
  },
  skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
  emptyStringAsUndefined: true,
});
