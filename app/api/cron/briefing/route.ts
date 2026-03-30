/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { NextResponse } from "next/server";
import { runBriefingJob } from "@/lib/cron/briefing.logic";

// GET /api/cron/briefing
// Triggered by Vercel Cron (vercel.json) or any external scheduler.
// Protected by CRON_SECRET bearer token.
export async function GET(req: Request) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runBriefingJob();
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Job failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
