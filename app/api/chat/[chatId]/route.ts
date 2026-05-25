/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.10
 * @since beta
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/core/auth/auth";
import {
  deleteChat,
  patchChatSchema,
  renameChat,
  setChatActiveSkill,
} from "@/lib/features/chat";

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

// PATCH /api/chat/[chatId] — rename and/or set active skill
export async function PATCH(req: Request, { params }: Params) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as unknown;
  const parsed = patchChatSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { chatId } = await params;

  if (parsed.data.title !== undefined) {
    const renameResult = await renameChat(
      chatId,
      session.user.id,
      parsed.data.title,
    );

    if (!renameResult.ok) {
      return NextResponse.json({ error: renameResult.error }, { status: 404 });
    }
  }

  if (parsed.data.activeSkillId !== undefined) {
    const skillResult = await setChatActiveSkill(
      chatId,
      session.user.id,
      parsed.data.activeSkillId,
    );

    if (!skillResult.ok) {
      return NextResponse.json({ error: skillResult.error }, { status: 404 });
    }
  }

  return NextResponse.json({ ok: true });
}
