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
  listReadingItems,
  createReadingItem,
  createReadingItemSchema,
} from "@/lib/features/reading-queue";
import {
  writeRateLimiter,
  getRateLimitIdentifier,
  createRateLimitResponse,
} from "@/lib/core/security";
import {
  enforceReadingQueueMax,
  createTierLimitResponse,
} from "@/lib/platform/tiers";

// GET /api/reading-queue — list reading items for the current user
export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const statusParam = searchParams.get("status");
  const validStatuses = ["unread", "read", "archived"] as const;
  type ReadingStatus = (typeof validStatuses)[number];

  const status = validStatuses.includes(statusParam as ReadingStatus)
    ? (statusParam as ReadingStatus)
    : undefined;

  const items = await listReadingItems(
    session.user.id,
    status ? { status } : {},
  );
  return NextResponse.json({ items });
}

// POST /api/reading-queue — save a new reading item (AI summary + score)
export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const identifier = getRateLimitIdentifier(req, session.user.id);
  const rateLimit = await writeRateLimiter.check(identifier);
  if (!rateLimit.allowed) {
    return createRateLimitResponse(rateLimit.retryAfterSeconds);
  }

  const gate = await enforceReadingQueueMax(session.user.id);
  if (!gate.allowed) return createTierLimitResponse(gate.reason);

  const body = (await req.json()) as unknown;
  const parsed = createReadingItemSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const item = await createReadingItem(session.user.id, parsed.data);
  return NextResponse.json({ item }, { status: 201 });
}
