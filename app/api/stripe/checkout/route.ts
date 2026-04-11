/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { createCheckoutSession } from "@/lib/stripe/checkout";
import { stripe } from "@/lib/stripe/client";

const bodySchema = z.object({
  priceId: z.string().min(1),
  /** Where to send the user on success (before ?session_id= is appended). */
  successUrl: z.string().url(),
  /** Where to send the user if they click "back" on the Stripe hosted page. */
  cancelUrl: z.string().url(),
});

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const raw = (await request.json()) as unknown;
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }
  const { priceId, successUrl, cancelUrl } = parsed.data;

  const user = await db.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { stripeCustomerId: true, email: true, name: true },
  });

  // Create Stripe customer on the fly if missing (e.g. users created before this feature)
  let stripeCustomerId = user.stripeCustomerId;
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      ...(user.name ? { name: user.name } : {}),
      metadata: { userId: session.user.id },
    });
    stripeCustomerId = customer.id;
    await db.user.update({
      where: { id: session.user.id },
      data: { stripeCustomerId },
    });
  }

  try {
    const checkoutUrl = await createCheckoutSession({
      stripeCustomerId,
      priceId,
      userId: session.user.id,
      successUrl,
      cancelUrl,
    });
    return NextResponse.json({ url: checkoutUrl });
  } catch (err) {
    console.error("[stripe/checkout] Error:", err);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 },
    );
  }
}
