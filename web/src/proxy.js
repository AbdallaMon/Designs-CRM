import { NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAME,
  AUTH_ROUTES,
  PROTECTED_PREFIXES,
  PUBLIC_V2_PREFIXES,
} from "./app/v2/lib/constant";

export function proxy(request) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get(AUTH_COOKIE_NAME);
  const isAuthenticated = Boolean(sessionCookie?.value);

  // PUBLIC token-authed surfaces start with `/v2` (so they match PROTECTED_PREFIXES) but must
  // NEVER be gated to /login — the query-string session token is the auth. Check this first.
  const isPublic = PUBLIC_V2_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );
  const isProtected =
    !isPublic && PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  if (isProtected && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);

    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && isAuthenticated) {
    // Cutover: send already-logged-in users to the /v2 landing fan-out (which routes each role
    // on to its default workspace), not the retired legacy /dashboard.
    return NextResponse.redirect(new URL("/v2", request.url));
  }
  return NextResponse.next();
}

export const config = {
  // Run on all routes except Next.js internals, static files, and sw.js.
  matcher: ["/((?!_next/static|_next/image|favicon\.ico|public/|sw\.js).*)"],
};
