/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { updateMeeting } from "@/lib/meetings/update.logic";
import { deleteMeeting } from "@/lib/meetings/delete.logic";
import { InvalidLabelSelectionError } from "@/lib/labels/shared.logic";
import { MeetingUpdateSchema } from "@/lib/meetings/schemas";
import { zodErrorMessage } from "@/lib/utils";

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

  const parsed = MeetingUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: zodErrorMessage(parsed.error) },
      { status: 400 },
    );
  }

  const d = parsed.data;
  try {
    const updated = await updateMeeting(session.user.id, id, {
      ...(d.title !== undefined && { title: d.title.trim() }),
      ...(d.scheduledAt !== undefined && {
        scheduledAt: new Date(d.scheduledAt),
      }),
      ...(d.durationMin !== undefined && {
        durationMin: d.durationMin ?? null,
      }),
      ...(d.location !== undefined && { location: d.location ?? null }),
      ...(d.agenda !== undefined && { agenda: d.agenda ?? null }),
      ...(d.summary !== undefined && { summary: d.summary ?? null }),
      ...(d.status !== undefined && { status: d.status }),
      ...(d.participantContactIds !== undefined && {
        participantContactIds: d.participantContactIds,
      }),
      ...(d.labelIds !== undefined && { labelIds: d.labelIds }),
    });

    if (!updated) {
      return NextResponse.json(
        { error: "Meeting not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ meeting: updated });
  } catch (error) {
    if (error instanceof InvalidLabelSelectionError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    throw error;
  }
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
