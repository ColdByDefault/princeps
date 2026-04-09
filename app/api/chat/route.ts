/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { listChats, createChat } from "@/lib/chat";
import { getChatHistoryLimit } from "@/lib/tiers";

// GET /api/chat — list chats for the current user
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [chats, historyLimit] = await Promise.all([
    listChats(session.user.id),
    getChatHistoryLimit(session.user.id),
  ]);

  return NextResponse.json({ chats, historyLimit });
}

// POST /api/chat — create a new chat
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
