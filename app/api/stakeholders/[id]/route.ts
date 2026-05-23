/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.4
 * @since canary-v1.1.4
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/core/auth/auth";
import { updateStakeholder, deleteStakeholder } from "@/lib/features/stakeholders";
import { updateStakeholderSchema } from "@/lib/features/stakeholders/schemas";
import {
  writeRateLimiter,
  getRateLimitIdentifier,
  createRateLimitResponse,
} from "@/lib/core/security";

// PATCH /api/stakeholders/[id]
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const identifier = getRateLimitIdentifier(req, session.user.id);
  const rateLimit = await writeRateLimiter.check(identifier);
  if (!rateLimit.allowed)
    return createRateLimitResponse(rateLimit.retryAfterSeconds);

  const { id } = await params;
  const body = (await req.json()) as unknown;
  const parsed = updateStakeholderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const result = await updateStakeholder(id, session.user.id, parsed.data);
  if (!result.ok) {
    return NextResponse.json({ error: "Stakeholder not found." }, { status: 404 });
  }

  return NextResponse.json({ stakeholder: result.stakeholder });
}

// DELETE /api/stakeholders/[id]
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const identifier = getRateLimitIdentifier(req, session.user.id);
  const rateLimit = await writeRateLimiter.check(identifier);
  if (!rateLimit.allowed)
    return createRateLimitResponse(rateLimit.retryAfterSeconds);

  const { id } = await params;
  const result = await deleteStakeholder(id, session.user.id);
  if (!result.ok) {
    return NextResponse.json({ error: "Stakeholder not found." }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
}
