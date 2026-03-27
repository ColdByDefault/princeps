/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getChatMessages } from "@/lib/chat/messages.logic";
import { AppSidebar, SiteHeader } from "@/components/shared";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getRequestConfig } from "@/i18n/request";
import { ChatWindow } from "@/components/chat";

type Props = { params: Promise<{ chatId: string }> };

export default async function ChatIdPage({ params }: Props) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  const { chatId } = await params;
  const { messages } = await getRequestConfig();

  const chatData = await getChatMessages(chatId, session.user.id);

  if (!chatData) {
    redirect("/chat");
  }

  const initialMessages = chatData.messages.map((m) => ({
    ...m,
    role: m.role as "user" | "assistant",
    createdAt: m.createdAt.toISOString(),
  }));

  return (
    <SidebarProvider>
      <AppSidebar messages={messages} sessionUser={session.user} />
      <SidebarInset>
        <SiteHeader messages={messages} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <ChatWindow
            chatId={chatId}
            initialMessages={initialMessages}
            messages={messages}
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
