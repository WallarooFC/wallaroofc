"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";

import { env } from "@/env";
import { isEmailAllowed } from "@/lib/auth/allow-list";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email address.");
const codeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/u, "Enter the 6-digit code from your authenticator app.");

export type AuthState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

async function callbackUrl(path = "/sign-in/callback"): Promise<string> {
  const hdrs = await headers();
  const origin = hdrs.get("origin") ?? hdrs.get("x-forwarded-origin") ?? env.NEXT_PUBLIC_PORTAL_URL;
  return new URL(path, origin).toString();
}

export async function requestMagicLink(
  _prev: AuthState | undefined,
  formData: FormData,
): Promise<AuthState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Invalid email." };
  }

  if (!isEmailAllowed(parsed.data)) {
    return {
      status: "error",
      message: "That email isn't on the access list. Speak to the Club President.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data,
    options: { emailRedirectTo: await callbackUrl(), shouldCreateUser: true },
  });

  if (error) {
    return { status: "error", message: error.message };
  }

  return {
    status: "success",
    message: "Check your inbox — we've sent a one-time sign-in link.",
  };
}

export async function signInWithMicrosoft(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "azure",
    options: {
      redirectTo: await callbackUrl(),
      scopes: "email openid profile",
    },
  });

  if (error || !data?.url) {
    redirect(`/sign-in?error=${encodeURIComponent(error?.message ?? "OAuth failed")}`);
  }

  redirect(data.url);
}

export async function signOut(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/sign-in");
}

export type MfaEnrolState =
  | { status: "ready"; factorId: string; qrSvgDataUrl: string; secret: string }
  | { status: "error"; message: string };

export async function startMfaEnrolment(): Promise<MfaEnrolState> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: "Authenticator app",
  });

  if (error || !data) {
    return { status: "error", message: error?.message ?? "Could not start MFA enrolment." };
  }

  return {
    status: "ready",
    factorId: data.id,
    qrSvgDataUrl: data.totp.qr_code,
    secret: data.totp.secret,
  };
}

export async function completeMfaEnrolment(
  _prev: AuthState | undefined,
  formData: FormData,
): Promise<AuthState> {
  const factorId = String(formData.get("factorId") ?? "");
  const codeResult = codeSchema.safeParse(formData.get("code"));

  if (!factorId) {
    return { status: "error", message: "Enrolment expired. Refresh the page to try again." };
  }
  if (!codeResult.success) {
    return {
      status: "error",
      message: codeResult.error.issues[0]?.message ?? "Invalid code.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
    factorId,
  });
  if (challengeError || !challenge) {
    return { status: "error", message: challengeError?.message ?? "Could not start challenge." };
  }

  const { error: verifyError } = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challenge.id,
    code: codeResult.data,
  });
  if (verifyError) {
    return { status: "error", message: verifyError.message };
  }

  redirect("/");
}

export async function verifyMfaCode(
  _prev: AuthState | undefined,
  formData: FormData,
): Promise<AuthState> {
  const codeResult = codeSchema.safeParse(formData.get("code"));
  const next = String(formData.get("next") ?? "/");

  if (!codeResult.success) {
    return {
      status: "error",
      message: codeResult.error.issues[0]?.message ?? "Invalid code.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data: factors, error: listError } = await supabase.auth.mfa.listFactors();
  if (listError) {
    return { status: "error", message: listError.message };
  }

  const verifiedFactor = factors?.totp.find((factor) => factor.status === "verified");
  if (!verifiedFactor) {
    redirect("/sign-in/mfa-setup");
  }

  const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
    factorId: verifiedFactor.id,
  });
  if (challengeError || !challenge) {
    return { status: "error", message: challengeError?.message ?? "Could not start challenge." };
  }

  const { error: verifyError } = await supabase.auth.mfa.verify({
    factorId: verifiedFactor.id,
    challengeId: challenge.id,
    code: codeResult.data,
  });
  if (verifyError) {
    return { status: "error", message: verifyError.message };
  }

  redirect(next.startsWith("/") ? next : "/");
}
