// ─── Provider ─────────────────────────────────────────────
export { callChat, streamChat } from "./openai";
export type {
  OpenAIMessage,
  OpenAIChatOptions,
  OpenAIChatResult,
} from "./openai";

// ─── Embedding ────────────────────────────────────────────
export { embed, embedBatch } from "./openai-embedding";

// ─── Settings ─────────────────────────────────────────────
export {
  getOpenAISettings,
  OpenAIProviderError,
  OPENAI_CHAT_MODELS,
  OPENAI_EMBEDDING_MODELS,
} from "./openai-settings";
export type {
  OpenAISettings,
  OpenAIChatModel,
  OpenAIEmbeddingModel,
} from "./openai-settings";
