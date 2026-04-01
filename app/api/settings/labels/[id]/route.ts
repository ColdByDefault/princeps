/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { deleteLabel } from "@/lib/labels/delete.logic";
import { LabelUpdateSchema } from "@/lib/labels/schemas";
import { updateLabel } from "@/lib/labels/update.logic";
import { zodErrorMessage } from "@/lib/utils";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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

  const parsed = LabelUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: zodErrorMessage(parsed.error) },
      { status: 400 },
    );
  }

  const { id } = await params;
  const result = await updateLabel(session.user.id, id, parsed.data.name);

  if (!result.ok) {
    if (result.error === "not_found") {
      return NextResponse.json({ error: "Label not found." }, { status: 404 });
    }

    return NextResponse.json(
      { error: "A label with this name already exists." },
      { status: 409 },
    );
  }

  return NextResponse.json({ label: result.label });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const deleted = await deleteLabel(session.user.id, id);
  if (!deleted) {
    return NextResponse.json({ error: "Label not found." }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
