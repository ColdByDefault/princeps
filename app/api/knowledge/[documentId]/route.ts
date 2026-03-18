/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { deleteKnowledgeDocument } from "@/lib/knowledge/delete.logic";
import {
  createRateLimitResponse,
  getRateLimitIdentifier,
  writeRateLimiter,
} from "@/lib/security";

interface RouteContext {
  params: Promise<{ documentId: string }>;
}

export async function DELETE(req: Request, context: RouteContext) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimit = writeRateLimiter.check(
    getRateLimitIdentifier(req, session.user.id),
  );

  if (!rateLimit.allowed) {
    return createRateLimitResponse(rateLimit.retryAfterSeconds);
  }

  try {
    const { documentId } = await context.params;
    await deleteKnowledgeDocument(session.user.id, documentId);

    return NextResponse.json({ deleted: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Document not found.") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Failed to delete knowledge document" },
      { status: 500 },
    );
  }
}
