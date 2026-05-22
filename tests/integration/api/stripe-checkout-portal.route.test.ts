import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GetSession, HeadersProvider } from "@/tests/helpers/types";

const mocks = vi.hoisted(() => ({
  createCheckoutSession: vi.fn<() => Promise<string>>(),
  createPortalSession: vi.fn<() => Promise<string>>(),
  getSession: vi.fn<GetSession>(),
  headers: vi.fn<HeadersProvider>(),
  stripeCustomerCreate: vi.fn<() => Promise<{ id: string }>>(),
  userFindUniqueOrThrow: vi.fn<() => Promise<Record<string, unknown>>>(),
  userUpdate: vi.fn<() => Promise<unknown>>(),
}));

vi.mock("next/headers", () => ({
  headers: mocks.headers,
}));

vi.mock("@/lib/core/auth/auth", () => ({
  auth: {
    api: {
      getSession: mocks.getSession,
    },
  },
}));

vi.mock("@/lib/core/db", () => ({
  db: {
    user: {
      findUniqueOrThrow: mocks.userFindUniqueOrThrow,
      update: mocks.userUpdate,
    },
  },
}));

vi.mock("@/lib/platform/stripe/client", () => ({
  stripe: {
    customers: {
      create: mocks.stripeCustomerCreate,
    },
  },
}));

vi.mock("@/lib/platform/stripe/checkout", () => ({
  createCheckoutSession: mocks.createCheckoutSession,
}));

vi.mock("@/lib/platform/stripe/portal", () => ({
  createPortalSession: mocks.createPortalSession,
}));

import { POST as checkoutPOST } from "@/app/api/stripe/checkout/route";
import { POST as portalPOST } from "@/app/api/stripe/portal/route";

describe("Stripe checkout and portal routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.headers.mockResolvedValue(new Headers());
    mocks.getSession.mockResolvedValue({ user: { id: "user-1" } });
    mocks.userFindUniqueOrThrow.mockResolvedValue({
      stripeCustomerId: "cus_1",
      email: "user@example.com",
      name: "Yazan",
    });
    mocks.userUpdate.mockResolvedValue({});
    mocks.stripeCustomerCreate.mockResolvedValue({ id: "cus_new" });
    mocks.createCheckoutSession.mockResolvedValue("https://stripe.test/pay");
    mocks.createPortalSession.mockResolvedValue("https://stripe.test/portal");
  });

  it("returns 401 when checkout is requested without a session", async () => {
    mocks.getSession.mockResolvedValueOnce(null);

    const response = await checkoutPOST(
      new Request("http://localhost/api/stripe/checkout", {
        body: JSON.stringify({}),
        method: "POST",
      }),
    );

    expect(response.status).toBe(401);
    expect(mocks.createCheckoutSession).not.toHaveBeenCalled();
  });

  it("validates checkout request bodies", async () => {
    const response = await checkoutPOST(
      new Request("http://localhost/api/stripe/checkout", {
        body: JSON.stringify({ priceId: "" }),
        method: "POST",
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid request body",
    });
  });

  it("creates a checkout session for an existing Stripe customer", async () => {
    const response = await checkoutPOST(
      new Request("http://localhost/api/stripe/checkout", {
        body: JSON.stringify({
          priceId: "price_pro",
          successUrl: "https://app.test/success",
          cancelUrl: "https://app.test/cancel",
        }),
        method: "POST",
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      url: "https://stripe.test/pay",
    });
    expect(mocks.createCheckoutSession).toHaveBeenCalledWith({
      stripeCustomerId: "cus_1",
      priceId: "price_pro",
      userId: "user-1",
      successUrl: "https://app.test/success",
      cancelUrl: "https://app.test/cancel",
    });
  });

  it("creates and stores a Stripe customer before checkout when missing", async () => {
    mocks.userFindUniqueOrThrow.mockResolvedValueOnce({
      stripeCustomerId: null,
      email: "user@example.com",
      name: "Yazan",
    });

    const response = await checkoutPOST(
      new Request("http://localhost/api/stripe/checkout", {
        body: JSON.stringify({
          priceId: "price_pro",
          successUrl: "https://app.test/success",
          cancelUrl: "https://app.test/cancel",
        }),
        method: "POST",
      }),
    );

    expect(response.status).toBe(200);
    expect(mocks.stripeCustomerCreate).toHaveBeenCalledWith({
      email: "user@example.com",
      name: "Yazan",
      metadata: { userId: "user-1" },
    });
    expect(mocks.userUpdate).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { stripeCustomerId: "cus_new" },
    });
    expect(mocks.createCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({ stripeCustomerId: "cus_new" }),
    );
  });

  it("creates a billing portal session for a linked customer", async () => {
    const response = await portalPOST(
      new Request("http://localhost/api/stripe/portal", {
        body: JSON.stringify({ returnUrl: "https://app.test/settings" }),
        method: "POST",
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      url: "https://stripe.test/portal",
    });
    expect(mocks.createPortalSession).toHaveBeenCalledWith({
      stripeCustomerId: "cus_1",
      returnUrl: "https://app.test/settings",
    });
  });

  it("returns 400 when opening the portal without a linked billing account", async () => {
    mocks.userFindUniqueOrThrow.mockResolvedValueOnce({
      stripeCustomerId: null,
    });

    const response = await portalPOST(
      new Request("http://localhost/api/stripe/portal", {
        body: JSON.stringify({ returnUrl: "https://app.test/settings" }),
        method: "POST",
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "No billing account linked to this user",
    });
  });
});
