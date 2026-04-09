/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getBriefing, generateBriefing } from "@/lib/briefings";
import {
  writeRateLimiter,
  getRateLimitIdentifier,
  createRateLimitResponse,
} from "@/lib/security";
import { enforceBriefingMonthly, createTierLimitResponse } from "@/lib/tiers";

// GET /api/briefings — return the cached briefing for the current user
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const briefing = await getBriefing(session.user.id);
  return NextResponse.json({ briefing });
}

// POST /api/briefings — regenerate the briefing for the current user
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

  const gate = await enforceBriefingMonthly(session.user.id);
  if (!gate.allowed) return createTierLimitResponse(gate.reason);

  const result = await generateBriefing(session.user.id);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ briefing: result.briefing }, { status: 201 });
}
