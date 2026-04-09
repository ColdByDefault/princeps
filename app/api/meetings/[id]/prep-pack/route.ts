/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { generatePrepPack } from "@/lib/meetings";
import {
  writeRateLimiter,
  getRateLimitIdentifier,
  createRateLimitResponse,
} from "@/lib/security";

type Params = { params: Promise<{ id: string }> };

// POST /api/meetings/[id]/prep-pack — generate or regenerate the prep pack
export async function POST(req: Request, { params }: Params) {
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

  const result = await generatePrepPack(id, session.user.id);

  if (!result.ok) {
    if ("notFound" in result && result.notFound) {
      return NextResponse.json(
        { error: "Meeting not found." },
        { status: 404 },
      );
    }
    return NextResponse.json(
      {
        error:
          "error" in result ? result.error : "Failed to generate prep pack.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ meeting: result.meeting });
}
