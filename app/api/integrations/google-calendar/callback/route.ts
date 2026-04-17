/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * SPDX-License-Identifier: Elastic-2.0
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { exchangeGoogleCode } from "@/lib/integrations/google-calendar/client";
import { upsertIntegration } from "@/lib/integrations/shared/upsert";

/**
 * GET /api/integrations/google-calendar/callback?code=...&state=...
 * Exchanges the authorization code for tokens and stores them.
 */
export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  // User denied access
  if (error) {
    return NextResponse.redirect(
      new URL("/settings?integration_error=access_denied", req.url),
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/settings?integration_error=invalid_callback", req.url),
    );
  }

  // CSRF state check
  const cookieStore = await cookies();
  const savedState = cookieStore.get("oauth_state_google")?.value;
  cookieStore.delete("oauth_state_google");

  if (!savedState || savedState !== state) {
    return NextResponse.redirect(
      new URL("/settings?integration_error=state_mismatch", req.url),
    );
  }

  try {
    const tokens = await exchangeGoogleCode(code);
    await upsertIntegration({
      userId: session.user.id,
      provider: "google_calendar",
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt,
    });
  } catch (err) {
    console.error("[google-calendar/callback] token exchange failed:", err);
    return NextResponse.redirect(
      new URL("/settings?integration_error=token_exchange", req.url),
    );
  }

  return NextResponse.redirect(
    new URL("/settings?connected=google_calendar", req.url),
  );
}
