/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.10
 * @since canary-v1.1.10
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/core/auth/auth";
import {
  deleteSkill,
  updateSkill,
  updateSkillSchema,
} from "@/lib/features/skills";
import {
  createRateLimitResponse,
  getRateLimitIdentifier,
  writeRateLimiter,
} from "@/lib/core/security";

type Params = { params: Promise<{ id: string }> };

// PATCH /api/skills/[id] — update a saved skill
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
  const parsed = updateSkillSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const result = await updateSkill(id, session.user.id, parsed.data);

  if (!result.ok) {
    if (result.notFound) {
      return NextResponse.json({ error: "Skill not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        error: `Invalid allowed tools: ${result.invalidTools.join(", ")}`,
      },
      { status: 400 },
    );
  }

  return NextResponse.json({ skill: result.skill });
}

// DELETE /api/skills/[id] — delete a saved skill
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
  const result = await deleteSkill(id, session.user.id);

  if (!result.ok) {
    return NextResponse.json({ error: "Skill not found" }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
}
