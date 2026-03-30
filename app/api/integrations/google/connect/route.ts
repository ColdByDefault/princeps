/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getGoogleAuthUrl } from "@/lib/integrations/google-oauth.logic";
import { SignJWT } from "jose";

const STATE_SECRET = new TextEncoder().encode(
  process.env.BETTER_AUTH_SECRET ?? "fallback-secret",
);

// GET /api/integrations/google/connect — redirect to Google OAuth consent
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Sign a short-lived state JWT containing userId for CSRF protection
  const state = await new SignJWT({ userId: session.user.id })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("10m")
    .sign(STATE_SECRET);

  const url = getGoogleAuthUrl(state);
  return NextResponse.redirect(url);
}
