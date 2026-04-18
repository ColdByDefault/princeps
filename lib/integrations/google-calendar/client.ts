/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version beta
 * @since beta
 * @module
 * @description
 */

import "server-only";

import { google } from "googleapis";
import { getValidToken } from "@/lib/integrations/shared/token";

const PROVIDER = "google_calendar";

function buildOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    process.env.GOOGLE_REDIRECT_URI!,
  );
}

/**
 * Returns an authenticated OAuth2 client for the given user,
 * refreshing the access token if needed.
 */
export async function getCalendarClient(userId: string) {
  const oauth2 = buildOAuth2Client();

  const accessToken = await getValidToken(
    userId,
    PROVIDER,
    async (refreshToken) => {
      oauth2.setCredentials({ refresh_token: refreshToken });
      const { credentials } = await oauth2.refreshAccessToken();
      return {
        accessToken: credentials.access_token!,
        expiresAt: credentials.expiry_date
          ? new Date(credentials.expiry_date)
          : null,
      };
    },
  );

  oauth2.setCredentials({ access_token: accessToken });
  return google.calendar({ version: "v3", auth: oauth2 });
}

/**
 * Builds the Google OAuth consent URL.
 * Requested scopes cover both calendar read/write and gmail read (future).
 */
export function buildGoogleAuthUrl(state: string): string {
  const oauth2 = buildOAuth2Client();
  return oauth2.generateAuthUrl({
    access_type: "offline",
    prompt: "consent", // always return refresh_token
    state,
    scope: [
      "https://www.googleapis.com/auth/calendar.readonly",
      "https://www.googleapis.com/auth/calendar.events",
    ],
  });
}

/**
 * Exchanges an authorization code for tokens.
 */
export async function exchangeGoogleCode(code: string): Promise<{
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date | null;
}> {
  const oauth2 = buildOAuth2Client();
  const { tokens } = await oauth2.getToken(code);
  return {
    accessToken: tokens.access_token!,
    refreshToken: tokens.refresh_token ?? null,
    expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
  };
}
