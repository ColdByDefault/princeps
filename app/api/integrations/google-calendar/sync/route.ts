/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version beta
 * @since beta
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/core/auth/auth";
import { syncGoogleCalendar } from "@/lib/platform/integrations/google-calendar/sync";
import {
  IntegrationNotFoundError,
  IntegrationExpiredError,
} from "@/lib/platform/integrations/shared/token";

/**
 * POST /api/integrations/google-calendar/sync
 * Triggers a manual sync of Google Calendar events into Meeting rows.
 */
export async function POST(_req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncGoogleCalendar(session.user.id);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof IntegrationNotFoundError) {
      return NextResponse.json({ error: "Not connected" }, { status: 400 });
    }
    if (err instanceof IntegrationExpiredError) {
      return NextResponse.json(
        { error: "Token expired — please reconnect" },
        { status: 401 },
      );
    }
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
