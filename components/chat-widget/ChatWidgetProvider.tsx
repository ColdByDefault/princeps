/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version beta
 * @since beta
 * @module
 * @description
 */

"use client";

import { useEffect, useState } from "react";
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
 * Fetches the assistant name fresh on mount so settings changes take effect
 * without a hard refresh.
 */
export function ChatWidgetProvider({
  authenticated,
  userId,
  assistantName: initialAssistantName,
}: ChatWidgetProviderProps) {
  const pathname = usePathname();
  const [assistantName, setAssistantName] = useState(initialAssistantName);

  useEffect(() => {
    if (!authenticated) return;
    fetch("/api/settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { assistantName: string | null } | null) => {
        if (data?.assistantName) {
          setAssistantName(data.assistantName);
        }
      })
      .catch(() => undefined);
  }, [authenticated]);

  if (!authenticated) return null;
  if (EXCLUDED_PATHS.includes(pathname)) return null;
  if (pathname === "/chat" || pathname.startsWith("/chat/")) return null;

  return <ChatWidget assistantName={assistantName} userId={userId} />;
}
