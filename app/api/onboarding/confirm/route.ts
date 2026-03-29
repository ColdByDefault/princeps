/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/onboarding/confirm
// Sets the ob_done cookie when the DB confirms onboarding is done, then
// redirects to /home. Used by already-onboarded users who lack the cookie
// (e.g. after a fresh deploy).
export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const userRow = await db.user.findUnique({
    where: { id: session.user.id },
    select: { preferences: true },
  });

  const rawPrefs =
    userRow?.preferences != null &&
    typeof userRow.preferences === "object" &&
    !Array.isArray(userRow.preferences)
      ? (userRow.preferences as Record<string, unknown>)
      : {};

  if (!rawPrefs["onboardingDone"]) {
    // Not actually done — send back to wizard
    redirect("/onboarding");
  }

  const homeUrl = new URL("/home", req.url);
  const response = NextResponse.redirect(homeUrl);
  response.cookies.set("ob_done", "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}
