/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.4
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/core/auth/auth";
import {
  updateReadingItem,
  deleteReadingItem,
  updateReadingItemSchema,
} from "@/lib/features/reading-queue";
import {
  writeRateLimiter,
  getRateLimitIdentifier,
  createRateLimitResponse,
} from "@/lib/core/security";

type Params = { params: Promise<{ id: string }> };

// PATCH /api/reading-queue/[id] — update status or title
export async function PATCH(req: Request, { params }: Params) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const identifier = getRateLimitIdentifier(req, session.user.id);
  const rateLimit = await writeRateLimiter.check(identifier);
  if (!rateLimit.allowed) {
    return createRateLimitResponse(rateLimit.retryAfterSeconds);
  }

  const { id } = await params;
  const body = (await req.json()) as unknown;
  const parsed = updateReadingItemSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const result = await updateReadingItem(session.user.id, id, parsed.data);

  if (!result.ok) {
    return NextResponse.json(
      { error: "Reading item not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({ item: result.record });
}

// DELETE /api/reading-queue/[id] — remove a reading item
export async function DELETE(req: Request, { params }: Params) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const identifier = getRateLimitIdentifier(req, session.user.id);
  const rateLimit = await writeRateLimiter.check(identifier);
  if (!rateLimit.allowed) {
    return createRateLimitResponse(rateLimit.retryAfterSeconds);
  }

  const { id } = await params;
  const result = await deleteReadingItem(session.user.id, id);

  if (!result.deleted) {
    return NextResponse.json(
      { error: "Reading item not found" },
      { status: 404 },
    );
  }

  return new NextResponse(null, { status: 204 });
}
