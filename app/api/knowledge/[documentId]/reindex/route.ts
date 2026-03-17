/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { reindexKnowledgeDocument } from "@/lib/knowledge/reindex.logic";
import {
  createRateLimitResponse,
  getRateLimitIdentifier,
  writeRateLimiter,
} from "@/lib/security";

interface RouteContext {
  params: Promise<{ documentId: string }>;
}

export async function POST(req: Request, context: RouteContext) {
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
    const document = await reindexKnowledgeDocument(
      session.user.id,
      documentId,
    );

    return NextResponse.json({ document });
  } catch (error) {
    if (error instanceof Error) {
      const status =
        error.message === "Document not found."
          ? 404
          : error.message === "Document re-index failed." ||
              error.message === "Embedding request failed" ||
              error.message === "Embedding response was empty"
            ? 502
            : 500;

      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json(
      { error: "Failed to re-index knowledge document" },
      { status: 500 },
    );
  }
}
