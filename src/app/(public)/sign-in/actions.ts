"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { isAllowListed } from "@/lib/auth/allow-list";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { env } from "@/env";

export type SignInState = {
  error?: string;
  message?: string;
};

const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email address.");

async function resolveOrigin() {
  const headerList = await headers();
  const origin = headerList.get("origin") ?? headerList.get("referer");
  if (origin) return new URL(origin).origin;
  return env.NEXT_PUBLIC_PORTAL_URL;
}

export async function signInWithMagicLink(
  _previousState: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid email." };
  }

  const email = parsed.data;
  if (!isAllowListed(email)) {
    return {
      error: "That email isn't on the access list. Speak to the Club President to request access.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const origin = await resolveOrigin();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      shouldCreateUser: false,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return {
    message: `Sign-in link sent to ${email}. Check your inbox and click the link.`,
  };
}

export async function signInWithMicrosoft() {
  const supabase = await createSupabaseServerClient();
  const origin = await resolveOrigin();

  const tenant = env.MICROSOFT_OAUTH_TENANT_ID;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "azure",
    options: {
      redirectTo: `${origin}/auth/callback`,
      scopes: "email openid profile offline_access",
      queryParams: tenant && tenant !== "common" ? { tenant } : undefined,
    },
  });

  if (error || !data.url) {
    throw new Error(error?.message ?? "Could not start Microsoft sign-in.");
  }

  redirect(data.url);
}
