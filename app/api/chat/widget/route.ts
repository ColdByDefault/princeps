/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/lib/auth";
import { chatMessageInputSchema } from "@/lib/chat/shared.logic";
import { sendWidgetMessage } from "@/lib/chat/widget.logic";
import {
  chatRateLimiter,
  createRateLimitResponse,
  getRateLimitIdentifier,
} from "@/lib/security";

export async function POST(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimit = chatRateLimiter.check(
    getRateLimitIdentifier(req, session.user.id),
  );

  if (!rateLimit.allowed) {
    return createRateLimitResponse(
      rateLimit.retryAfterSeconds,
      "Too many chat requests",
    );
  }

  try {
    const { message } = chatMessageInputSchema.parse(
      (await req.json()) as Record<string, unknown>,
    );
    const result = await sendWidgetMessage(session.user.id, message);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid request" },
        { status: 400 },
      );
    }

    if (
      error instanceof Error &&
      (error.message === "LLM request failed" ||
        error.message === "LLM response was empty")
    ) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }

    return NextResponse.json(
      { error: "Failed to send widget chat message" },
      { status: 500 },
    );
  }
}
