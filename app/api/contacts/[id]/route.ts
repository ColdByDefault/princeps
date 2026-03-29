/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { updateContact } from "@/lib/contacts/update.logic";
import { deleteContact } from "@/lib/contacts/delete.logic";

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

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return NextResponse.json(
      { error: "Body must be a JSON object." },
      { status: 400 },
    );
  }

  const { name, role, company, email, phone, notes, tags, lastContact } =
    body as Record<string, unknown>;

  const updated = await updateContact(session.user.id, id, {
    ...(typeof name === "string" && { name: name.trim() }),
    ...(role !== undefined && { role: typeof role === "string" ? role : null }),
    ...(company !== undefined && {
      company: typeof company === "string" ? company : null,
    }),
    ...(email !== undefined && {
      email: typeof email === "string" ? email : null,
    }),
    ...(phone !== undefined && {
      phone: typeof phone === "string" ? phone : null,
    }),
    ...(notes !== undefined && {
      notes: typeof notes === "string" ? notes : null,
    }),
    ...(Array.isArray(tags) && { tags: tags as string[] }),
    ...(lastContact !== undefined && {
      lastContact:
        typeof lastContact === "string" ? new Date(lastContact) : null,
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
