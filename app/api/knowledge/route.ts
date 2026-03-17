/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/lib/auth";
import { listKnowledgeDocuments } from "@/lib/knowledge/list.logic";
import { uploadKnowledgeDocument } from "@/lib/knowledge/upload.logic";
import {
  createRateLimitResponse,
  getRateLimitIdentifier,
  searchRateLimiter,
  uploadRateLimiter,
} from "@/lib/security";

export async function GET(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimit = searchRateLimiter.check(
    getRateLimitIdentifier(req, session.user.id),
  );

  if (!rateLimit.allowed) {
    return createRateLimitResponse(rateLimit.retryAfterSeconds);
  }

  const { searchParams } = new URL(req.url);

  try {
    const result = await listKnowledgeDocuments(session.user.id, {
      priority: searchParams.get("priority"),
      tag: searchParams.get("tag"),
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid request" },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Failed to list knowledge documents" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimit = uploadRateLimiter.check(
    getRateLimitIdentifier(req, session.user.id),
  );

  if (!rateLimit.allowed) {
    return createRateLimitResponse(
      rateLimit.retryAfterSeconds,
      "Too many upload requests",
    );
  }

  try {
    const document = await uploadKnowledgeDocument(
      session.user.id,
      await req.formData(),
    );

    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid request" },
        { status: 400 },
      );
    }

    if (error instanceof Error) {
      const status =
        error.message === "No text content could be extracted." ||
        error.message === "Document content could not be chunked."
          ? 422
          : error.message === "Embedding request failed" ||
              error.message === "Embedding response was empty"
            ? 502
            : error.message.includes("limit") ||
                error.message === "Title is required." ||
                error.message === "Unsupported knowledge source type." ||
                error.message === "Invalid document priority." ||
                error.message === "File is required."
              ? 400
              : 500;

      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json(
      { error: "Failed to upload knowledge document" },
      { status: 500 },
    );
  }
}
