/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/lib/auth";
import {
  getKnowledgePersonalInfo,
  updateKnowledgePersonalInfo,
} from "@/lib/knowledge/personal-info.logic";
import {
  createRateLimitResponse,
  getRateLimitIdentifier,
  searchRateLimiter,
  writeRateLimiter,
} from "@/lib/security";

export async function GET(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimit = searchRateLimiter.check(
    getRateLimitIdentifier(req, session.user.id),
  );

  if (!rateLimit.allowed) {
    return createRateLimitResponse(rateLimit.retryAfterSeconds);
  }

  try {
    const personalInfo = await getKnowledgePersonalInfo(session.user.id);

    return NextResponse.json({ personalInfo });
  } catch {
    return NextResponse.json(
      { error: "Failed to load personal info" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimit = writeRateLimiter.check(
    getRateLimitIdentifier(req, session.user.id),
  );

  if (!rateLimit.allowed) {
    return createRateLimitResponse(rateLimit.retryAfterSeconds);
  }

  try {
    const personalInfo = await updateKnowledgePersonalInfo(
      session.user.id,
      (await req.json()) as Record<string, unknown>,
    );

    return NextResponse.json({ personalInfo });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid request" },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Failed to update personal info" },
      { status: 500 },
    );
  }
}
