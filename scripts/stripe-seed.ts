/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version beta
 * @since beta
 * @module
 * @description
 */

import "dotenv/config";
import Stripe from "stripe";

async function main() {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) throw new Error("STRIPE_SECRET_KEY is not set in .env");
  if (!secret.startsWith("sk_test_")) {
    throw new Error(
      "Only test keys (sk_test_...) are allowed for seeding. Refusing to run against live keys.",
    );
  }

  const stripe = new Stripe(secret, { apiVersion: "2026-03-25.dahlia" });

  console.log("Creating Princeps products and prices in Stripe test mode…\n");

  // ─── Pro ────────────────────────────────────────────────

  const pro = await stripe.products.create({
    name: "Princeps Pro",
    description: "Pro plan — enhanced AI limits and features.",
  });

  const proMonthly = await stripe.prices.create({
    product: pro.id,
    unit_amount: 900, // €9.00
    currency: "eur",
    recurring: { interval: "month" },
    nickname: "Pro Monthly",
  });

  const proAnnual = await stripe.prices.create({
    product: pro.id,
    unit_amount: 8900, // €89.00
    currency: "eur",
    recurring: { interval: "year" },
    nickname: "Pro Annual",
  });

  // ─── Premium ─────────────────────────────────────────────

  const premium = await stripe.products.create({
    name: "Princeps Premium",
    description: "Premium plan — full limits and all features.",
  });

  const premiumMonthly = await stripe.prices.create({
    product: premium.id,
    unit_amount: 1900, // €19.00
    currency: "eur",
    recurring: { interval: "month" },
    nickname: "Premium Monthly",
  });

  const premiumAnnual = await stripe.prices.create({
    product: premium.id,
    unit_amount: 17900, // €179.00
    currency: "eur",
    recurring: { interval: "year" },
    nickname: "Premium Annual",
  });

  console.log("✅  Products and prices created!\n");
  console.log("─────────────────────────────────────────────");
  console.log("Add these to your .env file:\n");
  console.log(`STRIPE_PRICE_PRO_MONTHLY="${proMonthly.id}"`);
  console.log(`STRIPE_PRICE_PRO_ANNUAL="${proAnnual.id}"`);
  console.log(`STRIPE_PRICE_PREMIUM_MONTHLY="${premiumMonthly.id}"`);
  console.log(`STRIPE_PRICE_PREMIUM_ANNUAL="${premiumAnnual.id}"`);
  console.log("\n─────────────────────────────────────────────");
  console.log("\nFor webhooks, register endpoint:  POST /api/stripe/webhook");
  console.log(
    "Events to enable: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted",
  );
  console.log("\nFor local testing, use the Stripe CLI:");
  console.log("  stripe listen --forward-to localhost:3000/api/stripe/webhook");
  console.log("Then copy the whsec_... key to STRIPE_WEBHOOK_SECRET in .env");
  console.log("─────────────────────────────────────────────\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
