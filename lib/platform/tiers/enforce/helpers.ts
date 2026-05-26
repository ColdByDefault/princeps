/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.2.1
 * @since canary-v1.2.1
 */

import "server-only";

import { db } from "@/lib/core/db";
import { getPlanLimits, type Tier } from "@/types/billing";

export function todayUtc(): string {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

export function currentMonth(): string {
  return new Date().toISOString().slice(0, 7); // "YYYY-MM"
}

export async function getUserTier(userId: string): Promise<Tier> {
  const user = await db.user.findUniqueOrThrow({
    where: { id: userId },
    select: { tier: true },
  });

  return user.tier as Tier;
}

/**
 * Returns the existing UsageCounter row for the user, or creates one on first
 * access. Creation uses upsert to tolerate concurrent first-time requests.
 */
export async function getOrCreateCounter(userId: string) {
  return db.usageCounter.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
}

export async function getLimitsForUser(userId: string) {
  const tier = await getUserTier(userId);
  return getPlanLimits(tier);
}

export async function getLimitsAndCounter(userId: string) {
  const [tier, counter] = await Promise.all([
    getUserTier(userId),
    getOrCreateCounter(userId),
  ]);

  return {
    limits: getPlanLimits(tier),
    counter,
  };
}
