/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { getChatMessages } from "@/lib/chat";
import { AppSidebar, SiteHeader, ChatWindow } from "@/components/chat";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

type Props = { params: Promise<{ chatId: string }> };

export default async function ChatIdPage({ params }: Props) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  const { chatId } = await params;
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
      <AppSidebar
        sessionUser={{
          name: session.user.name ?? null,
          email: session.user.email ?? null,
        }}
        tier={session.user.tier ?? "free"}
      />
      <SidebarInset className="min-h-0">
        <SiteHeader />
        <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
          <ChatWindow chatId={chatId} initialMessages={initialMessages} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
