/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getRequestConfig } from "@/i18n/request";
import { listChats } from "@/lib/chat/list.logic";
import { CHAT_LIMIT } from "@/types/chat";
import { getChatMessages } from "@/lib/chat/messages.logic";
import { ChatShell } from "@/components/chat";
import { type ChatMessageData, type ChatSummary } from "@/types/chat";

type Props = { params: Promise<{ chatId: string }> };

export default async function ChatPage({ params }: Props) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  const { chatId } = await params;
  const { messages } = await getRequestConfig();

  const [chats, chatData] = await Promise.all([
    listChats(session.user.id),
    getChatMessages(chatId, session.user.id),
  ]);

  if (!chatData) {
    notFound();
  }

  const chatSummaries: ChatSummary[] = chats.map((c) => ({
    id: c.id,
    title: c.title,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }));

  const initialMessages: ChatMessageData[] = chatData.messages.map((m) => ({
    id: m.id,
    role: m.role as "user" | "assistant",
    content: m.content,
    createdAt: m.createdAt.toISOString(),
  }));

  return (
    <ChatShell
      chats={chatSummaries}
      activeChatId={chatId}
      initialMessages={initialMessages}
      messages={messages}
      atLimit={chats.length >= CHAT_LIMIT}
    />
  );
}

export async function generateMetadata({ params }: Props) {
  const { chatId } = await params;

  return {
    title: `Chat ${chatId.slice(0, 6)}… — See-Sweet`,
  };
}
