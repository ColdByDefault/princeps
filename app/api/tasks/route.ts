/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { listTasks } from "@/lib/tasks/list.logic";
import { createTask } from "@/lib/tasks/create.logic";
import { createTaskSchema } from "@/lib/tasks/schemas";

// GET /api/tasks — list tasks for the current user
export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const statusParam = searchParams.get("status");
  const validStatuses = ["open", "in_progress", "done", "cancelled"] as const;
  type TaskStatus = (typeof validStatuses)[number];

  const status = validStatuses.includes(statusParam as TaskStatus)
    ? (statusParam as TaskStatus)
    : undefined;

  const tasks = await listTasks(session.user.id, { status });
  return NextResponse.json({ tasks });
}

// POST /api/tasks — create a new task
export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as unknown;
  const parsed = createTaskSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const task = await createTask(session.user.id, parsed.data);
  return NextResponse.json({ task }, { status: 201 });
}
