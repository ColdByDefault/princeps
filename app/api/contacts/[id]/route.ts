/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { updateContact } from "@/lib/contacts/update.logic";
import { deleteContact } from "@/lib/contacts/delete.logic";
import { updateContactSchema } from "@/lib/contacts/schemas";
import {
  writeRateLimiter,
  getRateLimitIdentifier,
  createRateLimitResponse,
} from "@/lib/security";

type Params = { params: Promise<{ id: string }> };

// PATCH /api/contact/[id] — update a contact
export async function PATCH(req: Request, { params }: Params) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const identifier = getRateLimitIdentifier(req, session.user.id);
  const rateLimit = writeRateLimiter.check(identifier);
  if (!rateLimit.allowed) {
    return createRateLimitResponse(rateLimit.retryAfterSeconds);
  }

  const { id } = await params;
  const body = (await req.json()) as unknown;
  const parsed = updateContactSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const result = await updateContact(id, session.user.id, parsed.data);

  if (!result.ok) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }

  return NextResponse.json({ contact: result.contact });
}

// DELETE /api/contact/[id] — delete a contact
export async function DELETE(req: Request, { params }: Params) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const identifier = getRateLimitIdentifier(req, session.user.id);
  const rateLimit = writeRateLimiter.check(identifier);
  if (!rateLimit.allowed) {
    return createRateLimitResponse(rateLimit.retryAfterSeconds);
  }

  const { id } = await params;
  const result = await deleteContact(id, session.user.id);

  if (!result.ok) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
}
