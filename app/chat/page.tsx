/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getOrCreateFirstChat } from "@/lib/chat/create.logic";

export default async function ChatPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  const chatId = await getOrCreateFirstChat(session.user.id);

  if (!chatId) {
    // Chat limit reached and no chats exist — redirect home
    redirect("/home");
  }

  redirect(`/chat/${chatId}`);
}
