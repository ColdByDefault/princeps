/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listDecisions } from "@/lib/decisions/list.logic";
import { createDecision } from "@/lib/decisions/create.logic";

// GET /api/decisions — list all decisions for the current user
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const decisions = await listDecisions(session.user.id);
  return NextResponse.json({ decisions });
}

// POST /api/decisions — create a decision
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

  const { title, rationale, outcome, status, decidedAt, meetingId } =
    body as Record<string, unknown>;

  if (typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "title is required." }, { status: 400 });
  }

  const decision = await createDecision(session.user.id, {
    title: title.trim(),
    rationale: typeof rationale === "string" ? rationale : null,
    outcome: typeof outcome === "string" ? outcome : null,
    status: typeof status === "string" ? status : "open",
    decidedAt: typeof decidedAt === "string" ? new Date(decidedAt) : null,
    meetingId: typeof meetingId === "string" ? meetingId : null,
  });

  return NextResponse.json({ decision }, { status: 201 });
}
