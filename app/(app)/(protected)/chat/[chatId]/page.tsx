/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.2.1
 * @since beta
 */

import { redirect } from "next/navigation";
import { requireSession } from "@/lib/core/auth/session";
import { getChatMessages } from "@/lib/features/chat";
import { listSkills } from "@/lib/features/skills";
import { AppSidebar, SiteHeader } from "@/components/chat/sidebars/chat";
import { ChatWindow } from "@/components/chat/chat";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

type Props = { params: Promise<{ chatId: string }> };

export default async function ChatIdPage({ params }: Props) {
  const session = await requireSession();

  

  const { chatId } = await params;
  const [chatData, skills] = await Promise.all([
    getChatMessages(chatId, session.user.id),
    listSkills(session.user.id),
  ]);

  if (!chatData) {
    redirect("/chat");
  }

  const skillOptions = skills.map((skill) => ({
    id: skill.id,
    name: skill.name,
  }));

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
        <SiteHeader
          chatId={chatId}
          activeSkillId={chatData.chat.activeSkillId}
          skills={skillOptions}
        />
        <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
          <ChatWindow chatId={chatId} initialMessages={initialMessages} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
