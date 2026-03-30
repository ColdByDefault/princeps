/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { NextResponse } from "next/server";
import { runTasksOverdueJob } from "@/lib/cron/tasks-overdue.logic";

// GET /api/cron/tasks-overdue
export async function GET(req: Request) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runTasksOverdueJob();
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Job failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
