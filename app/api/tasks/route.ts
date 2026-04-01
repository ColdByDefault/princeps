/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listTasks } from "@/lib/tasks/list.logic";
import { createTask } from "@/lib/tasks/create.logic";
import { InvalidLabelSelectionError } from "@/lib/labels/shared.logic";
import { TaskCreateSchema } from "@/lib/tasks/schemas";
import { zodErrorMessage } from "@/lib/utils";

// GET /api/tasks — list all tasks for the current user
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tasks = await listTasks(session.user.id);
  return NextResponse.json({ tasks });
}

// POST /api/tasks — create a task
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

  const parsed = TaskCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: zodErrorMessage(parsed.error) },
      { status: 400 },
    );
  }

  const d = parsed.data;
  try {
    const task = await createTask(session.user.id, {
      title: d.title.trim(),
      notes: d.notes?.trim() || null,
      ...(d.status !== undefined && { status: d.status }),
      ...(d.priority !== undefined && { priority: d.priority }),
      dueDate: d.dueDate ? new Date(d.dueDate) : null,
      meetingId: d.meetingId ?? null,
      labelIds: d.labelIds ?? [],
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    if (error instanceof InvalidLabelSelectionError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    throw error;
  }
}
