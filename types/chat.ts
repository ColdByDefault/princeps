/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

export const CHAT_MESSAGE_ROLES = ["user", "assistant"] as const;
export const CHAT_SOURCE_KINDS = ["document", "meeting", "profile"] as const;

export type ChatMessageRole = (typeof CHAT_MESSAGE_ROLES)[number];
export type ChatSourceKind = (typeof CHAT_SOURCE_KINDS)[number];

export interface ChatMessage {
  id: string;
  role: ChatMessageRole;
  content: string;
  createdAt: Date | string;
}

export interface ChatConversation {
  id: string;
  title: string;
  lastMessageAt: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
  messages: ChatMessage[];
}

export interface ChatSource {
  kind: ChatSourceKind;
  label: string;
  snippet: string;
}

export interface ChatReplyResponse {
  conversation?: ChatConversation;
  reply: string;
  sources: ChatSource[];
}

export type ChatStreamEvent =
  | {
      type: "sources";
      sources: ChatSource[];
    }
  | {
      type: "chunk";
      content: string;
    }
  | {
      type: "done";
      conversation: ChatConversation;
      reply: string;
      sources: ChatSource[];
    }
  | {
      type: "error";
      error: string;
    };
