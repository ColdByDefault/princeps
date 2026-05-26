/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.2.1
 * @since beta
 */

import { redirect } from "next/navigation";
import { requireSession } from "@/lib/core/auth/session";
import { getOrCreateFirstChat } from "@/lib/features/chat";

export default async function ChatPage() {
  const session = await requireSession();

  

  const chatId = await getOrCreateFirstChat(session.user.id);

  if (!chatId) {
    redirect("/home");
  }

  redirect(`/chat/${chatId}`);
}

