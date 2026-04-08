/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { updateMemoryEntry } from "@/lib/memory/update.logic";
import { deleteMemoryEntry } from "@/lib/memory/delete.logic";
import { updateMemoryEntrySchema } from "@/lib/memory/schemas";
import {
  writeRateLimiter,
  getRateLimitIdentifier,
  createRateLimitResponse,
} from "@/lib/security";

type Params = { params: Promise<{ id: string }> };

// PATCH /api/memory/[id] — update a memory entry
export async function PATCH(req: Request, { params }: Params) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const identifier = getRateLimitIdentifier(req, session.user.id);
  const rateLimit = writeRateLimiter.check(identifier);
  if (!rateLimit.allowed) {
    return createRateLimitResponse(rateLimit.retryAfterSeconds);
  }

  const { id } = await params;
  const body = (await req.json()) as unknown;
  const parsed = updateMemoryEntrySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const entry = await updateMemoryEntry(session.user.id, id, parsed.data);

  if (!entry) {
    return NextResponse.json(
      { error: "Memory entry not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({ entry });
}

// DELETE /api/memory/[id] — delete a memory entry
export async function DELETE(req: Request, { params }: Params) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const identifier = getRateLimitIdentifier(req, session.user.id);
  const rateLimit = writeRateLimiter.check(identifier);
  if (!rateLimit.allowed) {
    return createRateLimitResponse(rateLimit.retryAfterSeconds);
  }

  const { id } = await params;
  const result = await deleteMemoryEntry(session.user.id, id);

  if (!result.ok) {
    return NextResponse.json(
      { error: "Memory entry not found" },
      { status: 404 },
    );
  }

  return new NextResponse(null, { status: 204 });
}
