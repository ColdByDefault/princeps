/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version beta
 * @since beta
 * @module
 * @description
 */

import "server-only";

import { db } from "@/lib/db";

interface UpsertIntegrationInput {
  userId: string;
  provider: string;
  accessToken: string;
  refreshToken?: string | null;
  expiresAt?: Date | null;
}

/**
 * Create or update the Integration row for a given user + provider pair.
 * Called after every successful OAuth callback.
 */
export async function upsertIntegration(
  input: UpsertIntegrationInput,
): Promise<void> {
  await db.integration.upsert({
    where: {
      userId_provider: {
        userId: input.userId,
        provider: input.provider,
      },
    },
    create: {
      userId: input.userId,
      provider: input.provider,
      accessToken: input.accessToken,
      refreshToken: input.refreshToken ?? null,
      expiresAt: input.expiresAt ?? null,
    },
    update: {
      accessToken: input.accessToken,
      refreshToken: input.refreshToken ?? null,
      expiresAt: input.expiresAt ?? null,
    },
  });
}

/**
 * Touch lastSyncedAt for a given user + provider after a successful sync.
 */
export async function markSynced(
  userId: string,
  provider: string,
): Promise<void> {
  await db.integration.update({
    where: { userId_provider: { userId, provider } },
    data: { lastSyncedAt: new Date() },
  });
}
