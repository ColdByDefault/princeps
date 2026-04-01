/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listMeetings } from "@/lib/meetings/list.logic";
import { createMeeting } from "@/lib/meetings/create.logic";
import { InvalidLabelSelectionError } from "@/lib/labels/shared.logic";
import { MeetingCreateSchema } from "@/lib/meetings/schemas";
import { zodErrorMessage } from "@/lib/utils";

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

  const parsed = MeetingCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: zodErrorMessage(parsed.error) },
      { status: 400 },
    );
  }

  const d = parsed.data;
  try {
    const meeting = await createMeeting(session.user.id, {
      title: d.title.trim(),
      scheduledAt: new Date(d.scheduledAt),
      durationMin: d.durationMin ?? null,
      location: d.location ?? null,
      agenda: d.agenda ?? null,
      participantContactIds: d.participantContactIds ?? [],
      labelIds: d.labelIds ?? [],
    });

    return NextResponse.json({ meeting }, { status: 201 });
  } catch (error) {
    if (error instanceof InvalidLabelSelectionError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    throw error;
  }
}
