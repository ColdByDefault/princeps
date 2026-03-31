/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { updateContact } from "@/lib/contacts/update.logic";
import { deleteContact } from "@/lib/contacts/delete.logic";
import { ContactUpdateSchema } from "@/lib/contacts/schemas";
import { zodErrorMessage } from "@/lib/utils";

// PATCH /api/contacts/[id] — update a contact
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

  const parsed = ContactUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: zodErrorMessage(parsed.error) },
      { status: 400 },
    );
  }

  const d = parsed.data;
  const updated = await updateContact(session.user.id, id, {
    ...(d.name !== undefined && { name: d.name.trim() }),
    ...(d.role !== undefined && { role: d.role ?? null }),
    ...(d.company !== undefined && { company: d.company ?? null }),
    ...(d.email !== undefined && { email: d.email ?? null }),
    ...(d.phone !== undefined && { phone: d.phone ?? null }),
    ...(d.notes !== undefined && { notes: d.notes ?? null }),
    ...(d.tags !== undefined && { tags: d.tags }),
    ...(d.lastContact !== undefined && {
      lastContact: d.lastContact ? new Date(d.lastContact) : null,
    }),
  });

  if (!updated) {
    return NextResponse.json({ error: "Contact not found." }, { status: 404 });
  }

  return NextResponse.json({ contact: updated });
}

// DELETE /api/contacts/[id] — delete a contact
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const deleted = await deleteContact(session.user.id, id);
  if (!deleted) {
    return NextResponse.json({ error: "Contact not found." }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
