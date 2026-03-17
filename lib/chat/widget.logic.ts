/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { buildChatPrompt } from "@/lib/chat/prompt.logic";
import { sendChatCompletion } from "@/lib/chat/provider.logic";
import { type ProviderMessage } from "@/lib/chat/shared.logic";

export async function sendWidgetMessage(userId: string, message: string) {
  const { prompt, sources } = await buildChatPrompt({
    history: [],
    message,
    userId,
  });

  const providerMessages: ProviderMessage[] = [
    { role: "system", content: prompt },
    { role: "user", content: message },
  ];

  const reply = await sendChatCompletion(providerMessages);

  return {
    reply,
    sources,
  };
}
