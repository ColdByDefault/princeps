/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { updateLabel, deleteLabel, updateLabelSchema } from "@/lib/labels";
import {
  writeRateLimiter,
  getRateLimitIdentifier,
  createRateLimitResponse,
} from "@/lib/security";

type Params = { params: Promise<{ id: string }> };

// PATCH /api/labels/[id] — update a label
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
  const parsed = updateLabelSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const result = await updateLabel(id, session.user.id, parsed.data);

  if (!result.ok) {
    if (result.notFound) {
      return NextResponse.json({ error: "Label not found" }, { status: 404 });
    }
    if ("duplicate" in result && result.duplicate) {
      return NextResponse.json(
        { error: "Duplicate label name" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Failed to update label" },
      { status: 500 },
    );
  }

  return NextResponse.json({ label: result.label });
}

// DELETE /api/labels/[id] — delete a label
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
  const result = await deleteLabel(id, session.user.id);

  if (!result.ok) {
    return NextResponse.json({ error: "Label not found" }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
}
