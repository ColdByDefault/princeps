/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateBriefing } from "@/lib/briefing/generate.logic";
import { briefingRateLimiter, createRateLimitResponse } from "@/lib/security";
import { getUserPreferences } from "@/lib/settings/get.logic";

const STALE_MS = 12 * 60 * 60 * 1000; // 12 hours

/**
 * GET /api/briefing
 * Returns the cached brief if fresh (< 12 h old), otherwise generates a new one.
 */
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const cached = await db.briefingCache.findUnique({ where: { userId } });

  if (cached && Date.now() - cached.generatedAt.getTime() < STALE_MS) {
    return NextResponse.json({
      content: cached.content,
      generatedAt: cached.generatedAt.toISOString(),
    });
  }

  try {
    const prefs = await getUserPreferences(userId);
    const result = await generateBriefing(
      userId,
      session.user.name ?? null,
      (session.user as { timezone?: string }).timezone ?? "UTC",
      prefs.language,
    );
    return NextResponse.json({
      content: result.content,
      generatedAt: result.generatedAt.toISOString(),
    });
  } catch (err) {
    console.error("[briefing] GET generation failed:", err);
    return NextResponse.json({ error: "Generation failed" }, { status: 502 });
  }
}

/**
 * POST /api/briefing
 * Forces re-generation regardless of cache age.
 */
export async function POST() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = briefingRateLimiter.check(session.user.id);
  if (!rl.allowed) return createRateLimitResponse(rl.retryAfterSeconds);

  try {
    const prefs = await getUserPreferences(session.user.id);
    const result = await generateBriefing(
      session.user.id,
      session.user.name ?? null,
      (session.user as { timezone?: string }).timezone ?? "UTC",
      prefs.language,
    );
    return NextResponse.json({
      content: result.content,
      generatedAt: result.generatedAt.toISOString(),
    });
  } catch (err) {
    console.error("[briefing] POST regeneration failed:", err);
    return NextResponse.json({ error: "Generation failed" }, { status: 502 });
  }
}
