/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/lib/auth";
import { getConversation } from "@/lib/chat/get.logic";
import { sendConversationMessage } from "@/lib/chat/send.logic";
import { chatMessageInputSchema } from "@/lib/chat/shared.logic";
import {
  chatRateLimiter,
  createRateLimitResponse,
  getRateLimitIdentifier,
  searchRateLimiter,
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
    const conversation = await getConversation(session.user.id);

    return NextResponse.json({ conversation });
  } catch {
    return NextResponse.json(
      { error: "Failed to load conversation" },
      { status: 500 },
    );
  }
}

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
    const result = await sendConversationMessage(session.user.id, message);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid request" },
        { status: 400 },
      );
    }

    if (error instanceof Error && error.message === "LLM request failed") {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }

    return NextResponse.json(
      { error: "Failed to send chat message" },
      { status: 500 },
    );
  }
}
