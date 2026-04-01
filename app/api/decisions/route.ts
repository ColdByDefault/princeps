/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listDecisions } from "@/lib/decisions/list.logic";
import { createDecision } from "@/lib/decisions/create.logic";
import { InvalidLabelSelectionError } from "@/lib/labels/shared.logic";
import { DecisionCreateSchema } from "@/lib/decisions/schemas";
import { zodErrorMessage } from "@/lib/utils";

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

  const parsed = DecisionCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: zodErrorMessage(parsed.error) },
      { status: 400 },
    );
  }

  const d = parsed.data;
  try {
    const decision = await createDecision(session.user.id, {
      title: d.title.trim(),
      rationale: d.rationale ?? null,
      outcome: d.outcome ?? null,
      status: d.status ?? "open",
      decidedAt: d.decidedAt ? new Date(d.decidedAt) : null,
      meetingId: d.meetingId ?? null,
      labelIds: d.labelIds ?? [],
    });

    return NextResponse.json({ decision }, { status: 201 });
  } catch (error) {
    if (error instanceof InvalidLabelSelectionError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    throw error;
  }
}
