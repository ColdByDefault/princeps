/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { updateTask } from "@/lib/tasks/update.logic";
import { deleteTask } from "@/lib/tasks/delete.logic";
import { TaskUpdateSchema } from "@/lib/tasks/schemas";
import { zodErrorMessage } from "@/lib/utils";

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

  const parsed = TaskUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: zodErrorMessage(parsed.error) },
      { status: 400 },
    );
  }

  const d = parsed.data;
  const task = await updateTask(session.user.id, id, {
    ...(d.title !== undefined && { title: d.title.trim() }),
    ...(d.notes !== undefined && { notes: d.notes?.trim() || null }),
    ...(d.status !== undefined && { status: d.status }),
    ...(d.priority !== undefined && { priority: d.priority }),
    ...(d.dueDate !== undefined && {
      dueDate: d.dueDate ? new Date(d.dueDate) : null,
    }),
    ...(d.meetingId !== undefined && { meetingId: d.meetingId ?? null }),
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
