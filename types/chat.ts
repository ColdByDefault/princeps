/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

export type ChatSummary = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

export type ChatMessageData = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

/** A message in progress during streaming — no id or createdAt yet. */
export type StreamingMessage = {
  role: "user" | "assistant";
  content: string;
  isThinking: boolean;
};
