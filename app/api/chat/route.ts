/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listChats } from "@/lib/chat/list.logic";
import { createChat } from "@/lib/chat/create.logic";
import { getPlanLimits } from "@/types/billing";
import { db } from "@/lib/db";

// GET /api/chat — list all chats for the current user, plus the tier-based history and daily limits
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [chats, user] = await Promise.all([
    listChats(session.user.id),
    db.user.findUnique({
      where: { id: session.user.id },
      select: { tier: true, chatsDailyCount: true, chatsDailyDate: true },
    }),
  ]);

  const limits = getPlanLimits(user?.tier ?? "free");
  const today = new Date().toISOString().slice(0, 10);
  const dailyUsed =
    user?.chatsDailyDate === today ? (user.chatsDailyCount ?? 0) : 0;

  return NextResponse.json({
    chats,
    historyLimit: limits.chatHistoryTotal,
    dailyUsed,
    dailyLimit: limits.chatsPerDay,
  });
}

// POST /api/chat — create a new chat (enforces the 10-chat limit)
export async function POST() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await createChat(session.user.id);

  if (!result.ok) {
    if (result.limitReached) {
      return NextResponse.json(
        { error: "Chat limit reached. Delete a chat to create a new one." },
        { status: 409 },
      );
    }

    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ chatId: result.chatId }, { status: 201 });
}
