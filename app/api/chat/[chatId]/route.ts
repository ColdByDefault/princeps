/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version beta
 * @since beta
 * @module
 * @description
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { deleteChat, renameChat } from "@/lib/chat";

type Params = { params: Promise<{ chatId: string }> };

// DELETE /api/chat/[chatId]
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

// PATCH /api/chat/[chatId] — rename
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
