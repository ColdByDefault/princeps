/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * SPDX-License-Identifier: Elastic-2.0
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";

/**
 * DELETE /api/integrations/google-calendar/disconnect
 * Removes the stored integration tokens. Does not delete synced meetings —
 * the user manages those manually.
 */
export async function DELETE(_req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await db.integration.deleteMany({
    where: { userId: session.user.id, provider: "google_calendar" },
  });

  return NextResponse.json({ ok: true });
}
