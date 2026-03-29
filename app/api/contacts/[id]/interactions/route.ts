/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/contacts/[id]/interactions — return recent interactions for a contact
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Verify ownership
  const contact = await db.contact.findUnique({
    where: { id },
    select: { userId: true },
  });

  if (!contact || contact.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const interactions = await db.contactInteraction.findMany({
    where: { contactId: id },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { id: true, source: true, sourceId: true, createdAt: true },
  });

  return NextResponse.json({ interactions });
}
