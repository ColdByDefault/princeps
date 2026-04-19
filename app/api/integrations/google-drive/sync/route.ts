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
import { indexDriveFiles } from "@/lib/integrations/google-drive";
import {
  IntegrationNotFoundError,
  IntegrationExpiredError,
} from "@/lib/integrations/shared/token";

/**
 * POST /api/integrations/google-drive/sync
 * Triggers a manual incremental index of the user's Google Drive files
 * into the Knowledge Base.
 */
export async function POST(_req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await indexDriveFiles(session.user.id);
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
    console.error("[google-drive/sync]", err);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
