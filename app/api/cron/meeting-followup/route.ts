/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { NextResponse } from "next/server";
import { runMeetingFollowupJob } from "@/lib/cron/meeting-followup.logic";

// GET /api/cron/meeting-followup
export async function GET(req: Request) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runMeetingFollowupJob();
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Job failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
