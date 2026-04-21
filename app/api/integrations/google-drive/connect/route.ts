/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version beta
 * @since beta
 * @module
 * @description
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { buildDriveAuthUrl } from "@/lib/integrations/google-drive/client";
import { randomBytes } from "crypto";

/**
 * GET /api/integrations/google-drive/connect
 * Redirects the user to Google's OAuth consent screen for Drive access.
 */
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const state = randomBytes(24).toString("hex");
  const cookieStore = await cookies();
  cookieStore.set("oauth_state_google_drive", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 10, // 10 minutes
    path: "/",
  });

  const url = buildDriveAuthUrl(state);
  return NextResponse.redirect(url);
}
