/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * SPDX-License-Identifier: Elastic-2.0
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { listGoals, createGoal, createGoalSchema } from "@/lib/goals";
import {
  writeRateLimiter,
  getRateLimitIdentifier,
  createRateLimitResponse,
} from "@/lib/security";
import { enforceGoalsMax, createTierLimitResponse } from "@/lib/tiers";

// GET /api/goals
export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const statusParam = searchParams.get("status");
  const validStatuses = ["open", "in_progress", "done", "cancelled"] as const;
  type GoalStatus = (typeof validStatuses)[number];

  const status = validStatuses.includes(statusParam as GoalStatus)
    ? (statusParam as GoalStatus)
    : undefined;

  const goals = await listGoals(session.user.id, status ? { status } : {});
  return NextResponse.json({ goals });
}

// POST /api/goals
export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const identifier = getRateLimitIdentifier(req, session.user.id);
  const rateLimit = await writeRateLimiter.check(identifier);
  if (!rateLimit.allowed)
    return createRateLimitResponse(rateLimit.retryAfterSeconds);

  const gate = await enforceGoalsMax(session.user.id);
  if (!gate.allowed) return createTierLimitResponse(gate.reason);

  const body = (await req.json()) as unknown;
  const parsed = createGoalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const goal = await createGoal(session.user.id, parsed.data);
  return NextResponse.json({ goal }, { status: 201 });
}
