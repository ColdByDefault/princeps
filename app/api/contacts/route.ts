/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listContacts } from "@/lib/contacts/list.logic";
import { createContact } from "@/lib/contacts/create.logic";
import { ContactCreateSchema } from "@/lib/contacts/schemas";
import { InvalidLabelSelectionError } from "@/lib/labels/shared.logic";
import { zodErrorMessage } from "@/lib/utils";

// GET /api/contacts — list all contacts for the current user
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contacts = await listContacts(session.user.id);
  return NextResponse.json({ contacts });
}

// POST /api/contacts — create a contact
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

  const parsed = ContactCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: zodErrorMessage(parsed.error) },
      { status: 400 },
    );
  }

  const d = parsed.data;
  try {
    const contact = await createContact(session.user.id, {
      name: d.name.trim(),
      role: d.role ?? null,
      company: d.company ?? null,
      email: d.email ?? null,
      phone: d.phone ?? null,
      notes: d.notes ?? null,
      tags: d.tags ?? [],
      labelIds: d.labelIds ?? [],
      lastContact: d.lastContact ? new Date(d.lastContact) : null,
    });

    return NextResponse.json({ contact }, { status: 201 });
  } catch (error) {
    if (error instanceof InvalidLabelSelectionError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    throw error;
  }
}
