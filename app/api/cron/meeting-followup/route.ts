/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * SPDX-License-Identifier: Elastic-2.0
 *
 * Cron worker: auto-expires stale upcoming meetings and sends follow-up reminders.
 *
 * Triggered by Vercel Cron at 18:00 UTC daily (see vercel.json).
 * Requires the CRON_SECRET environment variable to match the
 * "Authorization: Bearer <secret>" header sent by Vercel.
 *
 * A meeting is considered stale when its end time
 * (scheduledAt + durationMin) has passed but status is still "upcoming".
 * Those meetings are bulk-updated to "done".
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

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

  const now = new Date();

  // Fetch all upcoming meetings — we need durationMin to compute end time.
  const candidates = await db.meeting.findMany({
    where: { status: "upcoming" },
    select: { id: true, scheduledAt: true, durationMin: true },
  });

  const staleIds = candidates
    .filter((m) => {
      const endTime = m.durationMin
        ? new Date(m.scheduledAt.getTime() + m.durationMin * 60_000)
        : m.scheduledAt;
      return endTime <= now;
    })
    .map((m) => m.id);

  if (staleIds.length === 0) {
    return NextResponse.json({ updated: 0 });
  }

  const result = await db.meeting.updateMany({
    where: { id: { in: staleIds } },
    data: { status: "done" },
  });

  return NextResponse.json({ updated: result.count });
}
