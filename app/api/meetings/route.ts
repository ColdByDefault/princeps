/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listMeetings } from "@/lib/meetings/list.logic";
import { createMeeting } from "@/lib/meetings/create.logic";

// GET /api/meetings — list all meetings for the current user
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const meetings = await listMeetings(session.user.id);
  return NextResponse.json({ meetings });
}

// POST /api/meetings — create a meeting
export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return NextResponse.json(
      { error: "Body must be a JSON object." },
      { status: 400 },
    );
  }

  const {
    title,
    scheduledAt,
    durationMin,
    location,
    agenda,
    participantContactIds,
  } = body as Record<string, unknown>;

  if (typeof title !== "string" || title.trim() === "") {
    return NextResponse.json({ error: "title is required." }, { status: 400 });
  }
  if (typeof scheduledAt !== "string" || isNaN(Date.parse(scheduledAt))) {
    return NextResponse.json(
      { error: "scheduledAt must be a valid ISO date string." },
      { status: 400 },
    );
  }

  const meeting = await createMeeting(session.user.id, {
    title: title.trim(),
    scheduledAt: new Date(scheduledAt),
    durationMin: typeof durationMin === "number" ? durationMin : null,
    location: typeof location === "string" ? location : null,
    agenda: typeof agenda === "string" ? agenda : null,
    participantContactIds: Array.isArray(participantContactIds)
      ? (participantContactIds as string[])
      : [],
  });

  return NextResponse.json({ meeting }, { status: 201 });
}
