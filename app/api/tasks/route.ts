/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * SPDX-License-Identifier: Elastic-2.0
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { listTasks, createTask, createTaskSchema } from "@/lib/tasks";
import {
  writeRateLimiter,
  getRateLimitIdentifier,
  createRateLimitResponse,
} from "@/lib/security";
import { enforceTasksMax, createTierLimitResponse } from "@/lib/tiers";

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

  const tasks = await listTasks(session.user.id, status ? { status } : {});
  return NextResponse.json({ tasks });
}

// POST /api/tasks — create a new task
export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const identifier = getRateLimitIdentifier(req, session.user.id);
  const rateLimit = await writeRateLimiter.check(identifier);
  if (!rateLimit.allowed) {
    return createRateLimitResponse(rateLimit.retryAfterSeconds);
  }

  const gate = await enforceTasksMax(session.user.id);
  if (!gate.allowed) return createTierLimitResponse(gate.reason);

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
