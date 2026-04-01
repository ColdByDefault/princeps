/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { updateDecision } from "@/lib/decisions/update.logic";
import { deleteDecision } from "@/lib/decisions/delete.logic";
import { InvalidLabelSelectionError } from "@/lib/labels/shared.logic";
import { DecisionUpdateSchema } from "@/lib/decisions/schemas";
import { zodErrorMessage } from "@/lib/utils";

// PATCH /api/decisions/[id] — update a decision
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

  const parsed = DecisionUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: zodErrorMessage(parsed.error) },
      { status: 400 },
    );
  }

  const d = parsed.data;
  try {
    const updated = await updateDecision(session.user.id, id, {
      ...(d.title !== undefined && { title: d.title.trim() }),
      ...(d.rationale !== undefined && { rationale: d.rationale ?? null }),
      ...(d.outcome !== undefined && { outcome: d.outcome ?? null }),
      ...(d.status !== undefined && { status: d.status }),
      ...(d.decidedAt !== undefined && {
        decidedAt: d.decidedAt ? new Date(d.decidedAt) : null,
      }),
      ...(d.meetingId !== undefined && { meetingId: d.meetingId ?? null }),
      ...(d.labelIds !== undefined && { labelIds: d.labelIds }),
    });

    if (!updated) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    return NextResponse.json({ decision: updated });
  } catch (error) {
    if (error instanceof InvalidLabelSelectionError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    throw error;
  }
}

// DELETE /api/decisions/[id] — delete a decision
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const deleted = await deleteDecision(session.user.id, id);

  if (!deleted) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
}
