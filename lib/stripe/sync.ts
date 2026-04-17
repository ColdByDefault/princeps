/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * SPDX-License-Identifier: Elastic-2.0
 */

import "server-only";

import { db } from "@/lib/db";
import type { Tier } from "@/types/billing";

// ─── Price ID → Tier map ────────────────────────────────────────────────────

function buildPriceToTierMap(): Map<string, Tier> {
  const map = new Map<string, Tier>();
  const add = (key: string | undefined, tier: Tier) => {
    if (key) map.set(key, tier);
  };
  add(process.env.STRIPE_PRICE_PRO_MONTHLY, "pro");
  add(process.env.STRIPE_PRICE_PRO_ANNUAL, "pro");
  add(process.env.STRIPE_PRICE_PREMIUM_MONTHLY, "premium");
  add(process.env.STRIPE_PRICE_PREMIUM_ANNUAL, "premium");
  return map;
}

/** Lazily built so it reads env at call-time, not module-load-time. */
let _map: Map<string, Tier> | null = null;

function getPriceMap(): Map<string, Tier> {
  if (!_map) _map = buildPriceToTierMap();
  return _map;
}

export function tierFromPriceId(priceId: string): Tier {
  return getPriceMap().get(priceId) ?? "free";
}

// ─── DB sync ────────────────────────────────────────────────────────────────

/**
 * Updates the user row's tier based on a Stripe subscription state.
 * Called from the webhook handler and the checkout success page.
 *
 * @param stripeCustomerId - The Stripe customer ID stored on the user row.
 * @param priceId - The price ID of the active subscription item. Pass null when deleting.
 * @param active - Whether the subscription is in an active (or trialing) state.
 */
export async function syncUserTierFromSubscription(
  stripeCustomerId: string,
  priceId: string | null,
  active: boolean,
): Promise<void> {
  const tier: Tier =
    active && priceId ? (tierFromPriceId(priceId) ?? "free") : "free";

  await db.user.update({
    where: { stripeCustomerId },
    data: { tier },
  });
}
