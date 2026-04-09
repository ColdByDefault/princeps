/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import {
  listMemoryEntries,
  createMemoryEntry,
  createMemoryEntrySchema,
} from "@/lib/memory";
import {
  writeRateLimiter,
  getRateLimitIdentifier,
  createRateLimitResponse,
} from "@/lib/security";
import { enforceMemoryMax, createTierLimitResponse } from "@/lib/tiers";

// GET /api/memory — list memory entries for the current user
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const entries = await listMemoryEntries(session.user.id);
  return NextResponse.json({ entries });
}

// POST /api/memory — create a new memory entry
export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const identifier = getRateLimitIdentifier(req, session.user.id);
  const rateLimit = writeRateLimiter.check(identifier);
  if (!rateLimit.allowed) {
    return createRateLimitResponse(rateLimit.retryAfterSeconds);
  }

  const gate = await enforceMemoryMax(session.user.id);
  if (!gate.allowed) return createTierLimitResponse(gate.reason);

  const body = (await req.json()) as unknown;
  const parsed = createMemoryEntrySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const entry = await createMemoryEntry(session.user.id, parsed.data, "user");
  return NextResponse.json({ entry }, { status: 201 });
}
