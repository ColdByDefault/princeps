/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { syncGoogleCalendar } from "@/lib/integrations/google-calendar.logic";
import { GoogleAuthRevokedError } from "@/lib/integrations/google-oauth.logic";

// POST /api/integrations/google/sync — manual calendar sync
export async function POST() {
  if (
    !process.env.GOOGLE_CLIENT_ID ||
    !process.env.GOOGLE_CLIENT_SECRET ||
    !process.env.GOOGLE_REDIRECT_URI
  ) {
    return NextResponse.json(
      { error: "Google integration is not configured." },
      { status: 503 },
    );
  }

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncGoogleCalendar(session.user.id);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof GoogleAuthRevokedError) {
      return NextResponse.json({ error: "google_revoked" }, { status: 401 });
    }
    const message = err instanceof Error ? err.message : "Sync failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
