import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type HeadersProvider = () => Promise<Headers>;

const mocks = vi.hoisted(() => ({
  constructEvent: vi.fn(),
  headers: vi.fn<HeadersProvider>(),
  subscriptionRetrieve: vi.fn(),
  syncUserTierFromSubscription: vi.fn<() => Promise<void>>(),
}));

vi.mock("next/headers", () => ({
  headers: mocks.headers,
}));

vi.mock("@/lib/platform/stripe/client", () => ({
  stripe: {
    subscriptions: {
      retrieve: mocks.subscriptionRetrieve,
    },
    webhooks: {
      constructEvent: mocks.constructEvent,
    },
  },
}));

vi.mock("@/lib/platform/stripe/sync", () => ({
  syncUserTierFromSubscription: mocks.syncUserTierFromSubscription,
}));

import { POST } from "@/app/api/stripe/webhook/route";

const originalWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

describe("/api/stripe/webhook route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    mocks.headers.mockResolvedValue(new Headers({ "stripe-signature": "sig" }));
    mocks.syncUserTierFromSubscription.mockResolvedValue();
    mocks.subscriptionRetrieve.mockResolvedValue({
      customer: "cus_1",
      status: "active",
      items: { data: [{ price: { id: "price_pro" } }] },
    });
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    if (originalWebhookSecret === undefined) {
      delete process.env.STRIPE_WEBHOOK_SECRET;
    } else {
      process.env.STRIPE_WEBHOOK_SECRET = originalWebhookSecret;
    }
  });

  it("returns 400 when the Stripe signature header is missing", async () => {
    mocks.headers.mockResolvedValueOnce(new Headers());

    const response = await POST(
      new Request("http://localhost/api/stripe/webhook", {
        body: "{}",
        method: "POST",
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Missing stripe-signature",
    });
  });

  it("returns 500 when webhook secret is not configured", async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;

    const response = await POST(
      new Request("http://localhost/api/stripe/webhook", {
        body: "{}",
        method: "POST",
      }),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Webhook secret not configured",
    });
  });

  it("returns 400 when signature verification fails", async () => {
    mocks.constructEvent.mockImplementationOnce(() => {
      throw new Error("bad signature");
    });

    const response = await POST(
      new Request("http://localhost/api/stripe/webhook", {
        body: "{}",
        method: "POST",
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Webhook signature verification failed",
    });
  });

  it("syncs tier data when checkout completes for a subscription", async () => {
    mocks.constructEvent.mockReturnValueOnce({
      type: "checkout.session.completed",
      data: {
        object: {
          mode: "subscription",
          subscription: "sub_1",
          customer: "cus_1",
        },
      },
    });

    const response = await POST(
      new Request("http://localhost/api/stripe/webhook", {
        body: "{\"type\":\"checkout.session.completed\"}",
        method: "POST",
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ received: true });
    expect(mocks.subscriptionRetrieve).toHaveBeenCalledWith("sub_1");
    expect(mocks.syncUserTierFromSubscription).toHaveBeenCalledWith(
      "cus_1",
      "price_pro",
      true,
    );
  });

  it("syncs free tier when a subscription is deleted", async () => {
    mocks.constructEvent.mockReturnValueOnce({
      type: "customer.subscription.deleted",
      data: {
        object: {
          customer: "cus_1",
          status: "canceled",
          items: { data: [] },
        },
      },
    });

    const response = await POST(
      new Request("http://localhost/api/stripe/webhook", {
        body: "{}",
        method: "POST",
      }),
    );

    expect(response.status).toBe(200);
    expect(mocks.syncUserTierFromSubscription).toHaveBeenCalledWith(
      "cus_1",
      null,
      false,
    );
  });
});
