// ─── Provider ─────────────────────────────────────────────
export { callChat, streamChat } from "./groq";
export type { GroqMessage, GroqChatOptions, GroqChatResult } from "./groq";

// ─── Embedding ────────────────────────────────────────────
export { embed, embedBatch } from "./groq-embedding";

// ─── Settings ─────────────────────────────────────────────
export {
  getGroqSettings,
  GroqProviderError,
  GROQ_CHAT_MODELS,
} from "./groq-settings";
export type { GroqSettings, GroqChatModel } from "./groq-settings";
