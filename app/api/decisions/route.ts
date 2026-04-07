import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { listDecisions } from "@/lib/decisions/list.logic";
import { createDecision } from "@/lib/decisions/create.logic";
import { createDecisionSchema } from "@/lib/decisions/schemas";
import {
  writeRateLimiter,
  getRateLimitIdentifier,
  createRateLimitResponse,
} from "@/lib/security";
import { enforceDecisionsMax, createTierLimitResponse } from "@/lib/tiers";

// GET /api/decisions
export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const statusParam = searchParams.get("status");
  const validStatuses = ["open", "decided", "reversed"] as const;
  type DecisionStatus = (typeof validStatuses)[number];

  const status = validStatuses.includes(statusParam as DecisionStatus)
    ? (statusParam as DecisionStatus)
    : undefined;

  const decisions = await listDecisions(
    session.user.id,
    status ? { status } : {},
  );
  return NextResponse.json({ decisions });
}

// POST /api/decisions
export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const identifier = getRateLimitIdentifier(req, session.user.id);
  const rateLimit = writeRateLimiter.check(identifier);
  if (!rateLimit.allowed)
    return createRateLimitResponse(rateLimit.retryAfterSeconds);

  const gate = await enforceDecisionsMax(session.user.id);
  if (!gate.allowed) return createTierLimitResponse(gate.reason);

  const body = (await req.json()) as unknown;
  const parsed = createDecisionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const decision = await createDecision(session.user.id, parsed.data);
  return NextResponse.json({ decision }, { status: 201 });
}
