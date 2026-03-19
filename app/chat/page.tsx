/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getOrCreateFirstChat } from "@/lib/chat/create.logic";

/**
 * /chat — redirect to the most recent chat, or create one if none exist.
 */
export default async function ChatIndexPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  const chatId = await getOrCreateFirstChat(session.user.id);

  if (!chatId) {
    // Extremely unlikely on first visit; the limit page will show inside [chatId]
    redirect("/home");
  }

  redirect(`/chat/${chatId}`);
}
