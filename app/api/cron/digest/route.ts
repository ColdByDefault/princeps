/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.4
 * @since canary-v1.1.4
 */

import { NextResponse } from "next/server";
import { runWeeklyDigestNudges } from "@/lib/features/notifications";

export const dynamic = "force-dynamic";

async function handleDigestCron(req: Request) {
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

  const result = await runWeeklyDigestNudges();

  return NextResponse.json({
    message: `Weekly digest nudges created: ${result.created}.`,
    ...result,
  });
}

export async function POST(req: Request) {
  return handleDigestCron(req);
}
