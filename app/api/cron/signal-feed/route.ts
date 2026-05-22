/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.3
 * @since canary-v1.1.3
 * @module
 * @description Cron handler for the signal-feed sub-agent.
 * Runs weekly and generates an intelligence digest for every pro+ user
 * who has configured at least one signal topic in their preferences.
 * Secured by CRON_SECRET (Bearer token).
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/core/db";
import { runAgent } from "@/lib/ai/agents/registry";
import { getUserPreferences } from "@/lib/platform/settings/user-preferences.logic";

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

  // Fetch all pro+ users — signal-feed minTier is "pro"
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

    const prefs = await getUserPreferences(user.id);

    // Skip users who have no signal topics configured
    if (!prefs.signalTopics || prefs.signalTopics.length === 0) {
      results.skipped++;
      continue;
    }

    const topics = prefs.signalTopics.join(", ");
    const result = await runAgent("signal-feed", {
      userId: user.id,
      userMessage: `Fetch the latest signals and developments on: ${topics}`,
    });

    if (result.ok) {
      results.ok++;
    } else {
      results.failed++;
    }
  }

  return NextResponse.json({
    message: `Signal feed: ${results.ok} ok, ${results.skipped} skipped (no topics or wrong tier), ${results.failed} failed.`,
    ...results,
  });
}
