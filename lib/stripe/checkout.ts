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
 * Creates a Stripe Checkout Session for a subscription.
 * Returns the hosted Checkout URL to redirect the user to.
 */
export async function createCheckoutSession({
  stripeCustomerId,
  priceId,
  userId,
  successUrl,
  cancelUrl,
}: {
  stripeCustomerId: string;
  priceId: string;
  userId: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<string> {
  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl,
    metadata: { userId },
    subscription_data: {
      metadata: { userId },
    },
  });

  if (!session.url) throw new Error("Stripe did not return a checkout URL");
  return session.url;
}
