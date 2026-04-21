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
import { listDriveFiles } from "@/lib/integrations/google-drive";
import {
  IntegrationNotFoundError,
  IntegrationExpiredError,
} from "@/lib/integrations/shared/token";

/**
 * POST /api/integrations/google-drive/sync
 * Returns the list of supported Drive files with their import status.
 * Does NOT index any files — indexing is user-initiated via the import route.
 */
export async function POST(_req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const files = await listDriveFiles(session.user.id);
    return NextResponse.json({ files });
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
    return NextResponse.json(
      { error: "Failed to list files" },
      { status: 500 },
    );
  }
}
