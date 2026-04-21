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
import { exchangeGoogleDriveCode } from "@/lib/integrations/google-drive/client";
import { upsertIntegration } from "@/lib/integrations/shared/upsert";

/**
 * GET /api/integrations/google-drive/callback?code=...&state=...
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

  const cookieStore = await cookies();
  const savedState = cookieStore.get("oauth_state_google_drive")?.value;
  cookieStore.delete("oauth_state_google_drive");

  if (!savedState || savedState !== state) {
    return NextResponse.redirect(
      new URL("/settings?integration_error=state_mismatch", req.url),
    );
  }

  try {
    const tokens = await exchangeGoogleDriveCode(code);
    await upsertIntegration({
      userId: session.user.id,
      provider: "google_drive",
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt,
    });
  } catch (err) {
    console.error("[google-drive/callback] token exchange failed:", err);
    return NextResponse.redirect(
      new URL("/settings?integration_error=token_exchange", req.url),
    );
  }

  return NextResponse.redirect(
    new URL("/settings?connected=google_drive", req.url),
  );
}
