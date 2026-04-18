/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version beta
 * @since beta
 * @module
 * @description
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { stripe } from "@/lib/stripe/client";
import { syncUserTierFromSubscription } from "@/lib/stripe/sync";
import type Stripe from "stripe";

// Stripe sends raw body — must not be parsed by Next.js body parser
export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.text();
  const sig = (await headers()).get("stripe-signature");

  if (!sig) {
    return NextResponse.json(
      { error: "Missing stripe-signature" },
      { status: 400 },
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[stripe/webhook] STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 },
    );
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch {
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 },
    );
  }

  try {
    // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription" && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string,
          );
          const priceId = subscription.items.data[0]?.price.id ?? null;
          const customerId = session.customer as string;
          await syncUserTierFromSubscription(
            customerId,
            priceId,
            subscription.status === "active" ||
              subscription.status === "trialing",
          );
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const priceId = subscription.items.data[0]?.price.id ?? null;
        const customerId = subscription.customer as string;
        await syncUserTierFromSubscription(
          customerId,
          priceId,
          subscription.status === "active" ||
            subscription.status === "trialing",
        );
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        await syncUserTierFromSubscription(customerId, null, false);
        break;
      }

      default:
        // Unhandled event type — intentionally ignored.
        // Only checkout.session.completed, customer.subscription.updated,
        // and customer.subscription.deleted are relevant to tier management.
        break;
    }
  } catch (err) {
    console.error("[stripe/webhook] Handler error:", err);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
