/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listTasks } from "@/lib/tasks/list.logic";
import { createTask } from "@/lib/tasks/create.logic";

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

  if (typeof title !== "string" || title.trim() === "") {
    return NextResponse.json({ error: "title is required." }, { status: 400 });
  }

  const task = await createTask(session.user.id, {
    title: title.trim(),
    notes: typeof notes === "string" ? notes.trim() || null : null,
    ...(typeof status === "string" && { status }),
    ...(typeof priority === "string" && { priority }),
    dueDate: typeof dueDate === "string" && dueDate ? new Date(dueDate) : null,
    meetingId: typeof meetingId === "string" ? meetingId : null,
  });

  return NextResponse.json({ task }, { status: 201 });
}
