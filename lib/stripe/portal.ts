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

import { stripe } from "@/lib/stripe/client";

/**
 * Creates a Stripe Billing Portal Session.
 * Returns the portal URL to redirect the user to for managing their subscription.
 */
export async function createPortalSession({
  stripeCustomerId,
  returnUrl,
}: {
  stripeCustomerId: string;
  returnUrl: string;
}): Promise<string> {
  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: returnUrl,
  });

  return session.url;
}
