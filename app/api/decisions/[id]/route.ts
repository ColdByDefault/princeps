/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version beta
 * @since beta
 * @module
 * @description
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import {
  updateDecision,
  deleteDecision,
  updateDecisionSchema,
} from "@/lib/decisions";
import {
  writeRateLimiter,
  getRateLimitIdentifier,
  createRateLimitResponse,
} from "@/lib/security";

type Params = { params: Promise<{ id: string }> };

// PATCH /api/decisions/[id]
export async function PATCH(req: Request, { params }: Params) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const identifier = getRateLimitIdentifier(req, session.user.id);
  const rateLimit = await writeRateLimiter.check(identifier);
  if (!rateLimit.allowed)
    return createRateLimitResponse(rateLimit.retryAfterSeconds);

  const { id } = await params;
  const body = (await req.json()) as unknown;
  const parsed = updateDecisionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const result = await updateDecision(id, session.user.id, parsed.data);
  if (!result.ok) {
    if (result.notFound)
      return NextResponse.json(
        { error: "Decision not found" },
        { status: 404 },
      );
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ decision: result.decision });
}

// DELETE /api/decisions/[id]
export async function DELETE(req: Request, { params }: Params) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const identifier = getRateLimitIdentifier(req, session.user.id);
  const rateLimit = await writeRateLimiter.check(identifier);
  if (!rateLimit.allowed)
    return createRateLimitResponse(rateLimit.retryAfterSeconds);

  const { id } = await params;
  const result = await deleteDecision(id, session.user.id);
  if (!result.ok)
    return NextResponse.json({ error: "Decision not found" }, { status: 404 });

  return new NextResponse(null, { status: 204 });
}
