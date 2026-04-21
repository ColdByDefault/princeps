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
import { importDriveFile } from "@/lib/integrations/google-drive";
import {
  IntegrationNotFoundError,
  IntegrationExpiredError,
} from "@/lib/integrations/shared/token";

/**
 * POST /api/integrations/google-drive/import
 * Imports a single Drive file (by fileId) into the Knowledge Base.
 * Body: { fileId: string }
 */
export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let fileId: string;
  try {
    const body = (await req.json()) as { fileId?: unknown };
    if (!body.fileId || typeof body.fileId !== "string") {
      return NextResponse.json(
        { error: "fileId is required" },
        { status: 400 },
      );
    }
    fileId = body.fileId;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  try {
    const result = await importDriveFile(session.user.id, fileId);
    return NextResponse.json({ ok: true, name: result.name });
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
    const message = err instanceof Error ? err.message : "Import failed";
    console.error("[google-drive/import]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
