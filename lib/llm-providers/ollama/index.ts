// ─── Provider ─────────────────────────────────────────────
export { callChat, streamChat } from "./ollama";
export type {
  OllamaMessage,
  OllamaMessageRole,
  OllamaChatOptions,
  OllamaChatResult,
} from "./ollama";

// ─── Embedding ────────────────────────────────────────────
export { embed, embedBatch } from "./ollama-embedding";
export type { OllamaEmbedResult } from "./ollama-embedding";

// ─── Health ───────────────────────────────────────────────
export { checkOllamaHealth } from "./ollama-health";
export type { OllamaHealthStatus, OllamaModelInfo } from "./ollama-health";

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

// ─── Test ─────────────────────────────────────────────────
export { testOllamaChat, testOllamaEmbedding } from "./ollama-test";
export type { OllamaTestResult } from "./ollama-test";
