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
