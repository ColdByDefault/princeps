/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version beta
 * @since beta
 * @module
 * @description
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateBriefing } from "@/lib/briefings";
import { getUserPreferences } from "@/lib/settings/user-preferences.logic";

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

  // Fetch all user IDs — for large deployments, paginate this query.
  const users = await db.user.findMany({ select: { id: true } });

  const results = { ok: 0, failed: 0 };

  for (const user of users) {
    const prefs = await getUserPreferences(user.id);
    // Skip users who have explicitly opted out of automatic daily briefings.
    if (prefs.autoBriefingEnabled === false) continue;

    const result = await generateBriefing(user.id);
    if (result.ok) {
      results.ok++;
    } else {
      results.failed++;
    }
  }

  return NextResponse.json({
    message: `Briefings regenerated: ${results.ok} ok, ${results.failed} failed.`,
    ...results,
  });
}
