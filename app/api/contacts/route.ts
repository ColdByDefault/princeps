/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listContacts } from "@/lib/contacts/list.logic";
import { createContact } from "@/lib/contacts/create.logic";

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

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return NextResponse.json(
      { error: "Body must be a JSON object." },
      { status: 400 },
    );
  }

  const { name, role, company, email, phone, notes, tags, lastContact } =
    body as Record<string, unknown>;

  if (typeof name !== "string" || name.trim() === "") {
    return NextResponse.json({ error: "name is required." }, { status: 400 });
  }

  const contact = await createContact(session.user.id, {
    name: name.trim(),
    role: typeof role === "string" ? role : null,
    company: typeof company === "string" ? company : null,
    email: typeof email === "string" ? email : null,
    phone: typeof phone === "string" ? phone : null,
    notes: typeof notes === "string" ? notes : null,
    tags: Array.isArray(tags) ? (tags as string[]) : [],
    lastContact: typeof lastContact === "string" ? new Date(lastContact) : null,
  });

  return NextResponse.json({ contact }, { status: 201 });
}
