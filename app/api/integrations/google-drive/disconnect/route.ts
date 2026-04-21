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
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";

/**
 * DELETE /api/integrations/google-drive/disconnect
 * Removes the stored integration tokens.
 * Drive-indexed Knowledge Documents are NOT deleted — the user manages them
 * manually via the Knowledge Base page.
 */
export async function DELETE(_req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await db.integration.deleteMany({
    where: { userId: session.user.id, provider: "google_drive" },
  });

  return NextResponse.json({ ok: true });
}
