// ─── Provider ─────────────────────────────────────────────
export { callChat, streamChat } from "./ollama";
export type {
  OllamaMessage,
  OllamaChatOptions,
  OllamaChatResult,
} from "./ollama";

// ─── Embedding ────────────────────────────────────────────
export { embed, embedBatch } from "./ollama-embedding";

// ─── Settings ─────────────────────────────────────────────
export {
  getOllamaSettings,
  OllamaProviderError,
  OLLAMA_CHAT_MODELS,
  OLLAMA_EMBEDDING_MODELS,
} from "./ollama-settings";
export type {
  OllamaSettings,
  OllamaChatModel,
  OllamaEmbeddingModel,
} from "./ollama-settings";
