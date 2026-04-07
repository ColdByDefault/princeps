/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { updateMilestone, deleteMilestone } from "@/lib/goals/milestones.logic";
import { updateMilestoneSchema } from "@/lib/goals/schemas";
import {
  writeRateLimiter,
  getRateLimitIdentifier,
  createRateLimitResponse,
} from "@/lib/security";

type Params = { params: Promise<{ id: string; milestoneId: string }> };

// PATCH /api/goals/[id]/milestones/[milestoneId]
export async function PATCH(req: Request, { params }: Params) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const identifier = getRateLimitIdentifier(req, session.user.id);
  const rateLimit = writeRateLimiter.check(identifier);
  if (!rateLimit.allowed)
    return createRateLimitResponse(rateLimit.retryAfterSeconds);

  const { id: goalId, milestoneId } = await params;
  const body = (await req.json()) as unknown;
  const parsed = updateMilestoneSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const milestone = await updateMilestone(
    milestoneId,
    goalId,
    session.user.id,
    parsed.data,
  );
  if (!milestone)
    return NextResponse.json({ error: "Milestone not found" }, { status: 404 });

  return NextResponse.json({ milestone });
}

// DELETE /api/goals/[id]/milestones/[milestoneId]
export async function DELETE(req: Request, { params }: Params) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const identifier = getRateLimitIdentifier(req, session.user.id);
  const rateLimit = writeRateLimiter.check(identifier);
  if (!rateLimit.allowed)
    return createRateLimitResponse(rateLimit.retryAfterSeconds);

  const { id: goalId, milestoneId } = await params;
  const result = await deleteMilestone(milestoneId, goalId, session.user.id);
  if (!result.ok)
    return NextResponse.json({ error: "Milestone not found" }, { status: 404 });

  return new NextResponse(null, { status: 204 });
}
