/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

export type OllamaOptions = {
  temperature: number;
  top_p: number;
  top_k: number;
  num_ctx: number;
  repeat_penalty: number;
};

export type UserPreferences = {
  assistantInstructions: string;
  ollamaOptions: OllamaOptions;
};

export const DEFAULT_PREFERENCES: UserPreferences = {
  assistantInstructions: "",
  ollamaOptions: {
    temperature: 0.8,
    top_p: 0.9,
    top_k: 40,
    num_ctx: 2048,
    repeat_penalty: 1.1,
  },
};
