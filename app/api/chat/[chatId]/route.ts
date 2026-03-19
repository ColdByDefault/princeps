/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { deleteChat } from "@/lib/chat/delete.logic";
import { renameChat } from "@/lib/chat/update.logic";
import { getChatMessages } from "@/lib/chat/messages.logic";

type Params = { params: Promise<{ chatId: string }> };

// GET /api/chat/[chatId] — fetch messages for a chat
export async function GET(_req: Request, { params }: Params) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { chatId } = await params;
  const result = await getChatMessages(chatId, session.user.id);

  if (!result) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(result);
}

// DELETE /api/chat/[chatId] — delete a chat and its messages
export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { chatId } = await params;
  const result = await deleteChat(chatId, session.user.id);

  if (!result.ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

// PATCH /api/chat/[chatId] — rename a chat
export async function PATCH(req: Request, { params }: Params) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as { title?: unknown };

  if (typeof body.title !== "string" || !body.title.trim()) {
    return NextResponse.json({ error: "Invalid title" }, { status: 400 });
  }

  const { chatId } = await params;
  const result = await renameChat(chatId, session.user.id, body.title);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
