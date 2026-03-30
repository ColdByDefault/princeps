/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { db } from "@/lib/db";
import { exchangeGoogleCode } from "@/lib/integrations/google-oauth.logic";

const STATE_SECRET = new TextEncoder().encode(
  process.env.BETTER_AUTH_SECRET ?? "fallback-secret",
);

// GET /api/integrations/google/callback — OAuth callback from Google
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (error || !code || !state) {
    return NextResponse.redirect(
      `${appUrl}/settings/app?success=google_denied`,
    );
  }

  // Verify state JWT to get userId (CSRF protection)
  let userId: string;
  try {
    const { payload } = await jwtVerify(state, STATE_SECRET);
    userId = payload.userId as string;
  } catch {
    return NextResponse.redirect(
      `${appUrl}/settings/app?error=google_state_invalid`,
    );
  }

  try {
    const { accessToken, refreshToken, expiresAt } =
      await exchangeGoogleCode(code);

    await db.integration.upsert({
      where: { userId_provider: { userId, provider: "google_calendar" } },
      create: {
        userId,
        provider: "google_calendar",
        accessToken,
        refreshToken: refreshToken ?? null,
        expiresAt,
      },
      update: {
        accessToken,
        ...(refreshToken ? { refreshToken } : {}),
        expiresAt,
      },
    });
  } catch {
    return NextResponse.redirect(
      `${appUrl}/settings/app?error=google_exchange_failed`,
    );
  }

  return NextResponse.redirect(
    `${appUrl}/settings/app?success=google_connected`,
  );
}
