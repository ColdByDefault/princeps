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
  createSkill,
  createSkillSchema,
  listSkills,
} from "@/lib/features/skills";
import {
  enforceSkillsMax,
  createTierLimitResponse,
} from "@/lib/platform/tiers";
import {
  createRateLimitResponse,
  getRateLimitIdentifier,
  writeRateLimiter,
} from "@/lib/core/security";

// GET /api/skills — list all saved skills for the current user
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const skills = await listSkills(session.user.id);
  return NextResponse.json({ skills });
}

// POST /api/skills — create a saved skill
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

  const gate = await enforceSkillsMax(session.user.id);

  if (!gate.allowed) {
    return createTierLimitResponse(gate.reason);
  }

  const body = (await req.json()) as unknown;
  const parsed = createSkillSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const result = await createSkill(session.user.id, parsed.data);

  if (!result.ok) {
    return NextResponse.json(
      {
        error: `Invalid allowed tools: ${result.invalidTools.join(", ")}`,
      },
      { status: 400 },
    );
  }

  return NextResponse.json({ skill: result.skill }, { status: 201 });
}
