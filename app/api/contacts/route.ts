/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import {
  listContacts,
  createContact,
  createContactSchema,
} from "@/lib/contacts";
import { enforceContactsMax, createTierLimitResponse } from "@/lib/tiers";
import {
  writeRateLimiter,
  getRateLimitIdentifier,
  createRateLimitResponse,
} from "@/lib/security";

// GET /api/contact — list all contacts for the current user
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contacts = await listContacts(session.user.id);
  return NextResponse.json({ contacts });
}

// POST /api/contact — create a new contact
export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const identifier = getRateLimitIdentifier(req, session.user.id);
  const rateLimit = writeRateLimiter.check(identifier);
  if (!rateLimit.allowed) {
    return createRateLimitResponse(rateLimit.retryAfterSeconds);
  }

  const gate = await enforceContactsMax(session.user.id);
  if (!gate.allowed) {
    return createTierLimitResponse(gate.reason);
  }

  const body = (await req.json()) as unknown;
  const parsed = createContactSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const contact = await createContact(session.user.id, parsed.data);
  return NextResponse.json({ contact }, { status: 201 });
}
