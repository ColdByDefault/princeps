/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";
import { type UserPreferences, DEFAULT_PREFERENCES } from "@/types/settings";

export async function getUserPreferences(
  userId: string,
): Promise<UserPreferences> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { preferences: true },
  });

  const raw =
    user?.preferences && typeof user.preferences === "object"
      ? (user.preferences as Record<string, unknown>)
      : {};

  return {
    assistantInstructions:
      typeof raw["assistantInstructions"] === "string"
        ? raw["assistantInstructions"]
        : DEFAULT_PREFERENCES.assistantInstructions,
    ollamaOptions: {
      temperature:
        typeof (raw["ollamaOptions"] as Record<string, unknown> | undefined)?.[
          "temperature"
        ] === "number"
          ? ((raw["ollamaOptions"] as Record<string, unknown>)[
              "temperature"
            ] as number)
          : DEFAULT_PREFERENCES.ollamaOptions.temperature,
      top_p:
        typeof (raw["ollamaOptions"] as Record<string, unknown> | undefined)?.[
          "top_p"
        ] === "number"
          ? ((raw["ollamaOptions"] as Record<string, unknown>)[
              "top_p"
            ] as number)
          : DEFAULT_PREFERENCES.ollamaOptions.top_p,
      top_k:
        typeof (raw["ollamaOptions"] as Record<string, unknown> | undefined)?.[
          "top_k"
        ] === "number"
          ? ((raw["ollamaOptions"] as Record<string, unknown>)[
              "top_k"
            ] as number)
          : DEFAULT_PREFERENCES.ollamaOptions.top_k,
      num_ctx:
        typeof (raw["ollamaOptions"] as Record<string, unknown> | undefined)?.[
          "num_ctx"
        ] === "number"
          ? ((raw["ollamaOptions"] as Record<string, unknown>)[
              "num_ctx"
            ] as number)
          : DEFAULT_PREFERENCES.ollamaOptions.num_ctx,
      repeat_penalty:
        typeof (raw["ollamaOptions"] as Record<string, unknown> | undefined)?.[
          "repeat_penalty"
        ] === "number"
          ? ((raw["ollamaOptions"] as Record<string, unknown>)[
              "repeat_penalty"
            ] as number)
          : DEFAULT_PREFERENCES.ollamaOptions.repeat_penalty,
    },
  };
}
