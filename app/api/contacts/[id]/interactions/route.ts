/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.4
 * @since canary-v1.1.4
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/core/auth/auth";
import {
  logContactInteraction,
  listContactInteractions,
} from "@/lib/features/contacts";
import { logInteractionSchema } from "@/lib/features/contacts/schemas";
import {
  writeRateLimiter,
  getRateLimitIdentifier,
  createRateLimitResponse,
} from "@/lib/core/security";

type Params = { params: Promise<{ id: string }> };

// GET /api/contacts/[id]/interactions — list all notes for a contact
export async function GET(req: Request, { params }: Params) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const notes = await listContactInteractions(session.user.id, id);
  return NextResponse.json({ notes });
}

// POST /api/contacts/[id]/interactions — log a new interaction note
export async function POST(req: Request, { params }: Params) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const identifier = getRateLimitIdentifier(req, session.user.id);
  const rateLimit = await writeRateLimiter.check(identifier);
  if (!rateLimit.allowed) {
    return createRateLimitResponse(rateLimit.retryAfterSeconds);
  }

  const { id } = await params;
  const body = (await req.json()) as unknown;
  const parsed = logInteractionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const result = await logContactInteraction(session.user.id, id, parsed.data);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return NextResponse.json({ note: result.data }, { status: 201 });
}
