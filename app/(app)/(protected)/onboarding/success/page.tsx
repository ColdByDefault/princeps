/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.2.1
 * @since beta
 */

import { redirect } from "next/navigation";
import { requireSession } from "@/lib/core/auth/session";
import { stripe } from "@/lib/platform/stripe/client";
import { syncUserTierFromSubscription } from "@/lib/platform/stripe/sync";

type Props = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function OnboardingSuccessPage({ searchParams }: Props) {
  const session = await requireSession();
  

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
