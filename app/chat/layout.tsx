/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getRequestConfig } from "@/i18n/request";
import { listChats, CHAT_LIMIT } from "@/lib/chat/list.logic";
import { createChat } from "@/lib/chat/create.logic";

/**
 * The chat layout is intentionally minimal — it only handles auth and
 * first-visit redirect. The sidebar and shell are rendered inside each
 * [chatId] page so they have access to the active chat id.
 */
export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  void getRequestConfig; // used in child pages

  return <>{children}</>;
}

export async function generateMetadata() {
  return { title: "Chat — See-Sweet" };
}

/**
 * Exported so the index page can call it without duplicating auth logic.
 * Returns the chatId to redirect to, or null if at limit.
 */
export async function getOrCreateFirstChat(
  userId: string,
): Promise<string | null> {
  const chats = await listChats(userId);

  if (chats.length > 0) {
    return chats[0].id;
  }

  if (chats.length >= CHAT_LIMIT) {
    return null;
  }

  const result = await createChat(userId);

  return result.ok ? result.chatId : null;
}
