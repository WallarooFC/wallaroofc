import { NextResponse, type NextRequest } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const errorDescription = searchParams.get("error_description");

  if (errorDescription) {
    const url = new URL("/sign-in", origin);
    url.searchParams.set("error", errorDescription);
    return NextResponse.redirect(url);
  }

  if (!code) {
    const url = new URL("/sign-in", origin);
    url.searchParams.set("error", "Missing OAuth code.");
    return NextResponse.redirect(url);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const url = new URL("/sign-in", origin);
    url.searchParams.set("error", error.message);
    return NextResponse.redirect(url);
  }

  const target = next.startsWith("/") ? next : "/";
  return NextResponse.redirect(new URL(target, origin));
}
