/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import { usePathname } from "next/navigation";
import { ChatWidget } from "./chat-widget";

const EXCLUDED_PATHS = ["/", "/login", "/sign-up"];

interface ChatWidgetProviderProps {
  authenticated: boolean;
  userId: string;
  assistantName?: string | undefined;
}

/**
 * Renders the floating ChatWidget only for authenticated users,
 * and only on routes where it makes sense (not chat, landing, login, sign-up).
 */
export function ChatWidgetProvider({
  authenticated,
  userId,
  assistantName,
}: ChatWidgetProviderProps) {
  const pathname = usePathname();

  if (!authenticated) return null;
  if (EXCLUDED_PATHS.includes(pathname)) return null;
  if (pathname === "/chat" || pathname.startsWith("/chat/")) return null;

  return <ChatWidget assistantName={assistantName} userId={userId} />;
}
