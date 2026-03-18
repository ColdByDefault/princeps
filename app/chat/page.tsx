/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ChatPageView } from "@/components/chat";
import { getRequestConfig } from "@/i18n/request";
import { auth } from "@/lib/auth";
import { getConversation } from "@/lib/chat/get.logic";
import { type ChatConversation } from "@/types/chat";

function toChatConversation(
  value: Awaited<ReturnType<typeof getConversation>>,
): ChatConversation {
  return {
    ...value,
    messages: value.messages.map((message) => ({
      ...message,
      role: message.role as ChatConversation["messages"][number]["role"],
    })),
  };
}

export default async function ChatPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const { messages } = await getRequestConfig();
  const conversation = toChatConversation(
    await getConversation(session.user.id),
  );

  return (
    <ChatPageView
      key={`${conversation.id}:${conversation.lastMessageAt}:${conversation.messages.length}`}
      initialConversation={conversation}
      messages={messages}
    />
  );
}
