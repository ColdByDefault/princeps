/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { updateDecision } from "@/lib/decisions/update.logic";
import { deleteDecision } from "@/lib/decisions/delete.logic";

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

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return NextResponse.json(
      { error: "Body must be a JSON object." },
      { status: 400 },
    );
  }

  const { title, rationale, outcome, status, decidedAt, meetingId } =
    body as Record<string, unknown>;

  const updated = await updateDecision(session.user.id, id, {
    ...(typeof title === "string" && { title: title.trim() }),
    ...(rationale !== undefined && {
      rationale: typeof rationale === "string" ? rationale : null,
    }),
    ...(outcome !== undefined && {
      outcome: typeof outcome === "string" ? outcome : null,
    }),
    ...(typeof status === "string" && { status }),
    ...(decidedAt !== undefined && {
      decidedAt: typeof decidedAt === "string" ? new Date(decidedAt) : null,
    }),
    ...(meetingId !== undefined && {
      meetingId: typeof meetingId === "string" ? meetingId : null,
    }),
  });

  if (!updated) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  return NextResponse.json({ decision: updated });
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
