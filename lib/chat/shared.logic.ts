/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { z } from "zod";
import { CHAT_MESSAGE_ROLES } from "@/types/chat";

export const chatMessageRoleSchema = z.enum(CHAT_MESSAGE_ROLES);
export const chatMessageInputSchema = z.object({
  message: z.string().trim().min(1).max(2_000),
  stream: z.boolean().optional(),
});

export const conversationMessageSelect = {
  id: true,
  role: true,
  content: true,
  createdAt: true,
} as const;

export const conversationSelect = {
  id: true,
  title: true,
  lastMessageAt: true,
  createdAt: true,
  updatedAt: true,
  messages: {
    orderBy: {
      createdAt: "asc",
    },
    select: conversationMessageSelect,
  },
} as const;

export interface ProviderMessage {
  role: "system" | "user" | "assistant";
  content: string;
}
