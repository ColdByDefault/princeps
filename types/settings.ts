/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { type AppLanguage, DEFAULT_LANGUAGE } from "@/types/i18n";

export type OllamaOptions = {
  temperature: number;
  top_p: number;
  top_k: number;
  num_ctx: number;
  repeat_penalty: number;
};

export type ResponseStyle = "concise" | "detailed" | "formal" | "casual";

export const RESPONSE_STYLES: ResponseStyle[] = [
  "concise",
  "detailed",
  "formal",
  "casual",
];

export function isResponseStyle(v: unknown): v is ResponseStyle {
  return RESPONSE_STYLES.includes(v as ResponseStyle);
}

export type UserPreferences = {
  language: AppLanguage;
  assistantName: string;
  systemPrompt: string;
  responseStyle: ResponseStyle;
  ollamaOptions: OllamaOptions;
};

export const DEFAULT_PREFERENCES: UserPreferences = {
  language: DEFAULT_LANGUAGE,
  assistantName: "Atlas",
  systemPrompt: "",
  responseStyle: "concise",
  ollamaOptions: {
    temperature: 0.8,
    top_p: 0.9,
    top_k: 40,
    num_ctx: 2048,
    repeat_penalty: 1.1,
  },
};
