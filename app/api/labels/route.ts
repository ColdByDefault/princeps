/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { listLabels, createLabel, createLabelSchema } from "@/lib/labels";
import {
  writeRateLimiter,
  getRateLimitIdentifier,
  createRateLimitResponse,
} from "@/lib/security";

// GET /api/labels — list labels for the current user
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const labels = await listLabels(session.user.id);
  return NextResponse.json({ labels });
}

// POST /api/labels — create a new label
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

  const body = (await req.json()) as unknown;
  const parsed = createLabelSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const result = await createLabel(session.user.id, parsed.data);

  if (!result.ok) {
    if (result.duplicate) {
      return NextResponse.json(
        { error: "Duplicate label name" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Failed to create label" },
      { status: 500 },
    );
  }

  return NextResponse.json({ label: result.label }, { status: 201 });
}
