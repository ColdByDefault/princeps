/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/integrations/google — fetch current integration status
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const integration = await db.integration.findUnique({
    where: {
      userId_provider: {
        userId: session.user.id,
        provider: "google_calendar",
      },
    },
    select: { lastSyncedAt: true, createdAt: true },
  });

  return NextResponse.json({ connected: !!integration, integration });
}

// DELETE /api/integrations/google — disconnect Google Calendar
export async function DELETE() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await db.integration.deleteMany({
    where: { userId: session.user.id, provider: "google_calendar" },
  });

  return NextResponse.json({ ok: true });
}
