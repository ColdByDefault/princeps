/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version beta
 * @since beta
 * @module
 * @description
 */

import { type NextRequest, NextResponse } from "next/server";
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_COOKIE_NAME,
  isSupportedLanguage,
} from "@/types/i18n";

const publicRoutes = [
  "/",
  "/login",
  "/sign-up",
  "/forgot-password",
  "/reset-password",
  "/privacy-policy",
  "/terms-of-use",
  "/security",
];
const authRoutes = [
  "/login",
  "/sign-up",
  "/forgot-password",
  "/reset-password",
];

function matchesRoute(pathname: string, route: string) {
  if (route === "/") {
    return pathname === route;
  }

  return pathname === route || pathname.startsWith(`${route}/`);
}

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const sessionCookie =
    req.cookies.get("better-auth.session_token")?.value ??
    req.cookies.get("__Secure-better-auth.session_token")?.value;

  const isAuthenticated = Boolean(sessionCookie);
  const isPublicRoute = publicRoutes.some((route) =>
    matchesRoute(pathname, route),
  );
  const isAuthRoute = authRoutes.some((route) => matchesRoute(pathname, route));

  if (!isPublicRoute && !isAuthenticated) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthRoute && isAuthenticated) {
    const url = req.nextUrl.clone();
    url.pathname = "/home";
    return NextResponse.redirect(url);
  }

  // Seed language cookie on first visit for unauthenticated users only.
  // Authenticated users without a language cookie are handled by i18n/request.ts
  // which falls back to their DB preference, then LanguageHydrator re-seeds
  // the cookie client-side so subsequent requests use the fast cookie path.
  const hasLanguageCookie = req.cookies.has(LANGUAGE_COOKIE_NAME);
  if (!hasLanguageCookie && !isAuthenticated) {
    const acceptLanguage = req.headers.get("accept-language") ?? "";
    const preferred = acceptLanguage
      .split(",")
      .map((p) => p.trim().split(";")[0]?.toLowerCase().slice(0, 2) ?? "")
      .find((c) => isSupportedLanguage(c));

    const locale = preferred ?? DEFAULT_LANGUAGE;
    const response = NextResponse.next();
    response.cookies.set(LANGUAGE_COOKIE_NAME, locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|svg|jpg|jpeg|webp|gif)$).*)",
  ],
};
