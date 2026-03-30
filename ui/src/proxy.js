import { NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAME,
  AUTH_ROUTES,
  PROTECTED_PREFIXES,
} from "./app/v2/lib/constant";

export function proxy(request) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get(AUTH_COOKIE_NAME);
  const isAuthenticated = Boolean(sessionCookie?.value);

  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  if (isProtected && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    console.log(
      "Unauthenticated access to protected route, redirecting to login...",
    );
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && isAuthenticated) {
    console.log("Already authenticated, redirecting to dashboard...");
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  return NextResponse.next();
}

export const config = {
  // Run on all routes except Next.js internals, static files, and sw.js.
  matcher: ["/((?!_next/static|_next/image|favicon\.ico|public/|sw\.js).*)"],
};
