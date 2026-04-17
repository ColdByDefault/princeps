/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * SPDX-License-Identifier: Elastic-2.0
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { buildGoogleAuthUrl } from "@/lib/integrations/google-calendar/client";
import { randomBytes } from "crypto";

/**
 * GET /api/integrations/google-calendar/connect
 * Redirects the user to Google's OAuth consent screen.
 */
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Generate a CSRF state token and store it in a short-lived signed cookie
  const state = randomBytes(24).toString("hex");
  const cookieStore = await cookies();
  cookieStore.set("oauth_state_google", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 10, // 10 minutes
    path: "/",
  });

  const url = buildGoogleAuthUrl(state);
  return NextResponse.redirect(url);
}
