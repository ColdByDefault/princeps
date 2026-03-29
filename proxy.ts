/**
 * @author ColdByDefault
 * @copyright  2026 ColdByDefault. All Rights Reserved.
 *
 */

import { type NextRequest, NextResponse } from "next/server";

const publicRoutes = [
  "/",
  "/login",
  "/sign-up",
  "/privacy-policy",
  "/terms-of-use",
  "/security",
];
const authRoutes = ["/login", "/sign-up"];
// Routes that should not trigger the onboarding redirect
const onboardingBypassRoutes = ["/onboarding", "/api/onboarding"];

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

  // Onboarding gate — redirect authenticated users who haven't completed
  // onboarding. The ob_done cookie is set by /api/onboarding/complete and
  // /api/onboarding/confirm (for users who completed before the cookie existed).
  const isOnboardingBypass = onboardingBypassRoutes.some((route) =>
    matchesRoute(pathname, route),
  );
  if (isAuthenticated && !isOnboardingBypass) {
    const obDone = req.cookies.get("ob_done")?.value;
    if (!obDone) {
      const url = req.nextUrl.clone();
      url.pathname = "/onboarding";
      return NextResponse.redirect(url);
    }
  }

  // Admin guard — role check happens server-side in the page
  // (cookie only carries session token, not role; page does the DB check)

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|svg|jpg|jpeg|webp|gif)$).*)",
  ],
};
