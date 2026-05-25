/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.10
 * @since beta
 */

import "server-only";

import { db } from "@/lib/core/db";

export async function renameChat(
  chatId: string,
  userId: string,
  title: string,
) {
  const trimmed = title.trim().slice(0, 80);

  if (!trimmed) {
    return { ok: false, error: "Title cannot be empty" } as const;
  }

  const chat = await db.chat.findFirst({ where: { id: chatId, userId } });

  if (!chat) {
    return { ok: false, error: "Not found" } as const;
  }

  await db.chat.update({ where: { id: chatId }, data: { title: trimmed } });
  return { ok: true } as const;
}

export async function setChatActiveSkill(
  chatId: string,
  userId: string,
  activeSkillId: string | null,
) {
  const chat = await db.chat.findFirst({
    where: { id: chatId, userId },
    select: { id: true },
  });

  if (!chat) {
    return { ok: false, error: "Chat not found" } as const;
  }

  if (activeSkillId !== null) {
    const skill = await db.skill.findFirst({
      where: { id: activeSkillId, userId },
      select: { id: true },
    });

    if (!skill) {
      return { ok: false, error: "Skill not found" } as const;
    }
  }

  await db.chat.update({ where: { id: chatId }, data: { activeSkillId } });
  return { ok: true } as const;
}
