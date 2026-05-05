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
import { runOverdueTaskNudges } from "@/lib/notifications";

export const dynamic = "force-dynamic";

async function handleTasksOverdueCron(req: Request) {
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

  const result = await runOverdueTaskNudges();

  return NextResponse.json({
    message: `Overdue task nudges created: ${result.created}.`,
    ...result,
  });
}

export async function POST(req: Request) {
  return handleTasksOverdueCron(req);
}
