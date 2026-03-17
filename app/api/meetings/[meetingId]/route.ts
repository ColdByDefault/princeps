/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/lib/auth";
import { getMeeting } from "@/lib/meetings/get.logic";
import { updateMeeting } from "@/lib/meetings/update.logic";
import {
  createRateLimitResponse,
  getRateLimitIdentifier,
  searchRateLimiter,
  writeRateLimiter,
} from "@/lib/security";

interface RouteContext {
  params: Promise<{
    meetingId: string;
  }>;
}

export async function GET(req: Request, context: RouteContext) {
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
    const { meetingId } = await context.params;
    const meeting = await getMeeting(session.user.id, meetingId);

    return NextResponse.json({ meeting });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid request" },
        { status: 400 },
      );
    }

    if (error instanceof Error && error.message === "Meeting not found") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (error instanceof Error && error.message === "Invalid meeting id") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to load meeting" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request, context: RouteContext) {
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
    const { meetingId } = await context.params;
    const body = (await req.json()) as unknown;
    const meeting = await updateMeeting(session.user.id, meetingId, body);

    return NextResponse.json({ meeting });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid request" },
        { status: 400 },
      );
    }

    if (error instanceof Error && error.message === "Meeting not found") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (error instanceof Error && error.message === "Invalid meeting id") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to update meeting" },
      { status: 500 },
    );
  }
}
