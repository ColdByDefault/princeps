/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { updateMeeting } from "@/lib/meetings/update.logic";
import { deleteMeeting } from "@/lib/meetings/delete.logic";

// PATCH /api/meetings/[id] — update a meeting
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

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
    summary,
    status,
    participantContactIds,
  } = body as Record<string, unknown>;

  const updated = await updateMeeting(session.user.id, id, {
    ...(typeof title === "string" && { title: title.trim() }),
    ...(typeof scheduledAt === "string" &&
      !isNaN(Date.parse(scheduledAt)) && {
        scheduledAt: new Date(scheduledAt),
      }),
    ...(durationMin !== undefined && {
      durationMin: typeof durationMin === "number" ? durationMin : null,
    }),
    ...(location !== undefined && {
      location: typeof location === "string" ? location : null,
    }),
    ...(agenda !== undefined && {
      agenda: typeof agenda === "string" ? agenda : null,
    }),
    ...(summary !== undefined && {
      summary: typeof summary === "string" ? summary : null,
    }),
    ...(typeof status === "string" && { status }),
    ...(Array.isArray(participantContactIds) && {
      participantContactIds: participantContactIds as string[],
    }),
  });

  if (!updated) {
    return NextResponse.json({ error: "Meeting not found." }, { status: 404 });
  }

  return NextResponse.json({ meeting: updated });
}

// DELETE /api/meetings/[id] — delete a meeting
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const deleted = await deleteMeeting(session.user.id, id);
  if (!deleted) {
    return NextResponse.json({ error: "Meeting not found." }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
