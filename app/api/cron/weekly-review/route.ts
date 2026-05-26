/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.11
 * @since canary-v1.1.3
 * @module
 * @description Cron handler for the weekly-review sub-agent.
 * Runs every Monday morning and generates a structured weekly digest for
 * every pro+ user who has not disabled the weekly review.
 * Secured by CRON_SECRET (Bearer token).
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/core/db";
import { runToolFromCron } from "@/lib/ai/tools/cron";

export const dynamic = "force-dynamic";

const PRO_TIERS = new Set(["pro", "premium", "enterprise"]);

export async function POST(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured." },
      { status: 500 },
    );
  }

  const authHeader = req.headers.get("Authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch all pro+ users — free users cannot run weekly-review (minTier: "pro")
  const users = await db.user.findMany({
    where: { tier: { in: ["pro", "premium", "enterprise"] } },
    select: { id: true, tier: true },
  });

  const results = { ok: 0, skipped: 0, failed: 0 };

  for (const user of users) {
    if (!PRO_TIERS.has(user.tier)) {
      results.skipped++;
      continue;
    }

    const result = await runToolFromCron(user.id, "run_weekly_review", {});

    if (result.ok) {
      results.ok++;
    } else {
      results.failed++;
    }
  }

  return NextResponse.json({
    message: `Weekly review: ${results.ok} ok, ${results.skipped} skipped, ${results.failed} failed.`,
    ...results,
  });
}
