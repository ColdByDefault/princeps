/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.4
 * @since beta
 */

import "server-only";

import { db } from "@/lib/core/db";
import {
  decryptToken,
  encryptToken,
} from "@/lib/platform/integrations/shared/crypto";

export class IntegrationNotFoundError extends Error {
  constructor(provider: string) {
    super(`Integration not connected: ${provider}`);
    this.name = "IntegrationNotFoundError";
  }
}

export class IntegrationExpiredError extends Error {
  constructor(provider: string) {
    super(`Integration token expired and could not be refreshed: ${provider}`);
    this.name = "IntegrationExpiredError";
  }
}

/**
 * Returns a valid access token for the given provider, automatically refreshing
 * if the token is within 5 minutes of expiry.
 *
 * Throws IntegrationNotFoundError if the user has not connected this provider.
 * Throws IntegrationExpiredError if the refresh fails (user must reconnect).
 */
export async function getValidToken(
  userId: string,
  provider: string,
  refreshFn: (refreshToken: string) => Promise<{
    accessToken: string;
    expiresAt: Date | null;
  }>,
): Promise<string> {
  const integration = await db.integration.findUnique({
    where: { userId_provider: { userId, provider } },
  });

  if (!integration) {
    throw new IntegrationNotFoundError(provider);
  }

  const fiveMinutes = 5 * 60 * 1000;
  const isExpiringSoon =
    integration.expiresAt &&
    integration.expiresAt.getTime() - Date.now() < fiveMinutes;

  if (!isExpiringSoon) {
    return decryptToken(integration.accessToken);
  }

  if (!integration.refreshToken) {
    throw new IntegrationExpiredError(provider);
  }

  try {
    const refreshed = await refreshFn(decryptToken(integration.refreshToken));
    await db.integration.update({
      where: { userId_provider: { userId, provider } },
      data: {
        accessToken: encryptToken(refreshed.accessToken),
        expiresAt: refreshed.expiresAt,
      },
    });
    return refreshed.accessToken;
  } catch {
    throw new IntegrationExpiredError(provider);
  }
}
