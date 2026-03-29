/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { updateTask } from "@/lib/tasks/update.logic";
import { deleteTask } from "@/lib/tasks/delete.logic";

// PATCH /api/tasks/[id] — update a task
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

  const { title, notes, status, priority, dueDate, meetingId } = body as Record<
    string,
    unknown
  >;

  const task = await updateTask(session.user.id, id, {
    ...(typeof title === "string" && { title: title.trim() }),
    ...(notes !== undefined && {
      notes: typeof notes === "string" ? notes.trim() || null : null,
    }),
    ...(typeof status === "string" && { status }),
    ...(typeof priority === "string" && { priority }),
    ...(dueDate !== undefined && {
      dueDate:
        typeof dueDate === "string" && dueDate ? new Date(dueDate) : null,
    }),
    ...(meetingId !== undefined && {
      meetingId: typeof meetingId === "string" ? meetingId : null,
    }),
  });

  if (!task) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  return NextResponse.json({ task });
}

// DELETE /api/tasks/[id] — delete a task
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const deleted = await deleteTask(session.user.id, id);

  if (!deleted) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
}
