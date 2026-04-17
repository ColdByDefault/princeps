/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * SPDX-License-Identifier: Elastic-2.0
 *
 * Landing page after Stripe Checkout completes.
 * Retrieves the session, updates the user tier immediately, then redirects to /home.
 *
 * The webhook handler in /api/stripe/webhook is the durable fallback.
 * This page provides instant feedback if the user returns before the webhook fires.
 */

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { stripe } from "@/lib/stripe/client";
import { syncUserTierFromSubscription } from "@/lib/stripe/sync";

type Props = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function OnboardingSuccessPage({ searchParams }: Props) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const params = await searchParams;
  const sessionId = params["session_id"];

  if (sessionId) {
    try {
      const checkoutSession = await stripe.checkout.sessions.retrieve(
        sessionId,
        { expand: ["subscription"] },
      );

      if (
        checkoutSession.status === "complete" &&
        checkoutSession.subscription &&
        typeof checkoutSession.subscription !== "string"
      ) {
        const subscription = checkoutSession.subscription;
        const priceId = subscription.items.data[0]?.price.id ?? null;
        const customerId = checkoutSession.customer as string;

        await syncUserTierFromSubscription(
          customerId,
          priceId,
          subscription.status === "active" ||
            subscription.status === "trialing",
        );
      }
    } catch (err) {
      // Non-fatal: the webhook will handle this as a fallback
      console.error("[onboarding/success] Failed to sync tier:", err);
    }
  }

  // Redirect to home — tier is now updated (or will be shortly via webhook)
  redirect("/home");
}
