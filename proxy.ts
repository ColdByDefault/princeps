/**
 * @author ColdByDefault
 * @copyright  2026 ColdByDefault. All Rights Reserved.
 *
 */

import { type NextRequest, NextResponse } from "next/server";

// Routes that require authentication
const protectedRoutes = ["/home"];

// Routes accessible only when NOT authenticated
const authRoutes = ["/login", "/sign-up"];

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const sessionCookie =
    req.cookies.get("better-auth.session_token")?.value ??
    req.cookies.get("__Secure-better-auth.session_token")?.value;

  const isAuthenticated = Boolean(sessionCookie);
  const isProtected = protectedRoutes.some((r) => pathname.startsWith(r));
  const isAuthRoute = authRoutes.some((r) => pathname.startsWith(r));

  // Unauthenticated user hitting a protected route → redirect to login
  if (isProtected && !isAuthenticated) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  // Authenticated user hitting login/sign-up → redirect to home
  if (isAuthRoute && isAuthenticated) {
    const url = req.nextUrl.clone();
    url.pathname = "/home";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
