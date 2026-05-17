import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { env } from "@/env";

const SIGN_IN_PATH = "/sign-in";
const MFA_VERIFY_PATH = "/sign-in/mfa-verify";
const MFA_SETUP_PATH = "/sign-in/mfa-setup";
const AUTH_CALLBACK_PREFIX = "/sign-in/callback";

function isUnauthPath(pathname: string): boolean {
  if (pathname === SIGN_IN_PATH) return true;
  if (pathname.startsWith(AUTH_CALLBACK_PREFIX)) return true;
  if (pathname === "/auth/sign-out" || pathname.startsWith("/auth/")) return true;
  if (pathname.startsWith("/api/")) return true;
  return false;
}

function redirectTo(request: NextRequest, pathname: string, next?: string | null): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  if (next) url.searchParams.set("next", next);
  return NextResponse.redirect(url);
}

export async function updateSession(request: NextRequest): Promise<NextResponse> {
  // Surface the pathname to Server Components -- headers() can read this.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);

  let response = NextResponse.next({ request: { headers: requestHeaders } });

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) => {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request: { headers: requestHeaders } });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;
  const preserveNext =
    pathname !== "/" && !pathname.startsWith("/sign-in") ? `${pathname}${search}` : null;

  if (!user) {
    if (isUnauthPath(pathname)) return response;
    return redirectTo(request, SIGN_IN_PATH, preserveNext);
  }

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  const currentLevel = aal?.currentLevel ?? "aal1";
  const nextLevel = aal?.nextLevel ?? "aal1";

  if (currentLevel === "aal2") {
    if (
      pathname === SIGN_IN_PATH ||
      pathname === MFA_SETUP_PATH ||
      pathname === MFA_VERIFY_PATH ||
      pathname.startsWith(AUTH_CALLBACK_PREFIX)
    ) {
      return redirectTo(request, "/");
    }
    return response;
  }

  const needsVerify = nextLevel === "aal2";

  if (needsVerify) {
    if (pathname === MFA_VERIFY_PATH || pathname.startsWith(AUTH_CALLBACK_PREFIX)) return response;
    return redirectTo(request, MFA_VERIFY_PATH, preserveNext);
  }

  if (pathname === MFA_SETUP_PATH || pathname.startsWith(AUTH_CALLBACK_PREFIX)) return response;
  return redirectTo(request, MFA_SETUP_PATH);
}
