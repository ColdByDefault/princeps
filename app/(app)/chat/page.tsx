/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version beta
 * @since beta
 * @module
 * @description
 */

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { getOrCreateFirstChat } from "@/lib/chat";

export default async function ChatPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  const chatId = await getOrCreateFirstChat(session.user.id);

  if (!chatId) {
    redirect("/home");
  }

  redirect(`/chat/${chatId}`);
}
