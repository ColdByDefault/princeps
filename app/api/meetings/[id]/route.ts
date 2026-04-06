/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { updateMeeting } from "@/lib/meetings/update.logic";
import { deleteMeeting } from "@/lib/meetings/delete.logic";
import { updateMeetingSchema } from "@/lib/meetings/schemas";

type Params = { params: Promise<{ id: string }> };

// PATCH /api/meetings/[id] — update a meeting
export async function PATCH(req: Request, { params }: Params) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await req.json()) as unknown;
  const parsed = updateMeetingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const result = await updateMeeting(id, session.user.id, parsed.data);

  if (!result.ok) {
    if (result.notFound) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ meeting: result.meeting });
}

// DELETE /api/meetings/[id] — delete a meeting
export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const result = await deleteMeeting(id, session.user.id);

  if (!result.ok) {
    return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
}
