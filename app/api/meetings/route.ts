/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import {
  listMeetings,
  createMeeting,
  createMeetingSchema,
} from "@/lib/meetings";
import {
  writeRateLimiter,
  getRateLimitIdentifier,
  createRateLimitResponse,
} from "@/lib/security";
import { enforceMeetingsMax, createTierLimitResponse } from "@/lib/tiers";

// GET /api/meetings — list meetings for the current user
export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const statusParam = searchParams.get("status");
  const validStatuses = ["upcoming", "done", "cancelled"] as const;
  type MeetingStatus = (typeof validStatuses)[number];

  const status = validStatuses.includes(statusParam as MeetingStatus)
    ? (statusParam as MeetingStatus)
    : undefined;

  const meetings = await listMeetings(
    session.user.id,
    status ? { status } : {},
  );
  return NextResponse.json({ meetings });
}

// POST /api/meetings — create a new meeting
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

  const gate = await enforceMeetingsMax(session.user.id);
  if (!gate.allowed) return createTierLimitResponse(gate.reason);

  const body = (await req.json()) as unknown;
  const parsed = createMeetingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const meeting = await createMeeting(session.user.id, parsed.data);
  return NextResponse.json({ meeting }, { status: 201 });
}
