/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

/**
 * Thrown when Google returns `invalid_grant` — the user has revoked access
 * or the refresh token has expired. The Integration row is deleted before
 * this is thrown, so callers can treat it as a clean disconnect.
 */
export class GoogleAuthRevokedError extends Error {
  constructor(userId: string) {
    super(`Google Calendar access revoked for user ${userId}`);
    this.name = "GoogleAuthRevokedError";
  }
}

export function getGoogleAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/calendar.readonly",
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeGoogleCode(code: string): Promise<{
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date;
}> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
      grant_type: "authorization_code",
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Google token exchange failed: ${body}`);
  }

  const data = (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };

  const expiresAt = new Date(Date.now() + data.expires_in * 1000);
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? null,
    expiresAt,
  };
}

export async function refreshGoogleToken(
  userId: string,
  refreshToken: string,
): Promise<{ accessToken: string; expiresAt: Date }> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    let parsed: { error?: string } = {};
    try {
      parsed = JSON.parse(body) as { error?: string };
    } catch {
      // not JSON — fall through to generic error
    }
    if (parsed.error === "invalid_grant") {
      await db.integration.deleteMany({
        where: { userId, provider: "google_calendar" },
      });
      throw new GoogleAuthRevokedError(userId);
    }
    throw new Error(`Google token refresh failed: ${body}`);
  }

  const data = (await res.json()) as {
    access_token: string;
    expires_in: number;
  };

  const expiresAt = new Date(Date.now() + data.expires_in * 1000);

  await db.integration.update({
    where: { userId_provider: { userId, provider: "google_calendar" } },
    data: { accessToken: data.access_token, expiresAt },
  });

  return { accessToken: data.access_token, expiresAt };
}

/**
 * Returns a valid access token for the user's Google Calendar integration,
 * auto-refreshing if the current token is expired or about to expire.
 */
export async function getValidAccessToken(userId: string): Promise<string> {
  const integration = await db.integration.findUnique({
    where: { userId_provider: { userId, provider: "google_calendar" } },
  });

  if (!integration) throw new Error("Google Calendar not connected");

  const bufferMs = 60 * 1000;
  const needsRefresh =
    !integration.expiresAt ||
    integration.expiresAt.getTime() - Date.now() < bufferMs;

  if (needsRefresh) {
    if (!integration.refreshToken)
      throw new Error("No refresh token available");
    const { accessToken } = await refreshGoogleToken(
      userId,
      integration.refreshToken,
    );
    return accessToken;
  }

  return integration.accessToken;
}
