import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UpdateProfileInput } from "@/lib/features/profile/schemas";
import type * as profileSchemas from "@/lib/features/profile/schemas";

type Session = {
  user: {
    id: string;
  };
};

type HeadersProvider = () => Promise<Headers>;
type GetSession = (args: { headers: Headers }) => Promise<Session | null>;
type UpdateProfile = (
  userId: string,
  input: UpdateProfileInput,
) => Promise<
  | { ok: true; name: string | null; username: string | null }
  | { ok: false; error: string }
>;

const mocks = vi.hoisted(() => ({
  getSession: vi.fn<GetSession>(),
  headers: vi.fn<HeadersProvider>(),
  updateProfile: vi.fn<UpdateProfile>(),
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

vi.mock("@/lib/features/profile", async () => {
  const actual = await vi.importActual<typeof profileSchemas>(
    "@/lib/features/profile/schemas",
  );

  return {
    updateProfile: mocks.updateProfile,
    updateProfileSchema: actual.updateProfileSchema,
  };
});

import { PATCH } from "@/app/api/profile/route";

describe("/api/profile route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.headers.mockResolvedValue(new Headers());
    mocks.getSession.mockResolvedValue({ user: { id: "user-1" } });
    mocks.updateProfile.mockResolvedValue({
      ok: true,
      name: "Yazan",
      username: "yazan.dev",
    });
  });

  it("returns 401 without a session", async () => {
    mocks.getSession.mockResolvedValueOnce(null);

    const response = await PATCH(
      new Request("http://localhost/api/profile", {
        body: JSON.stringify({ name: "Yazan" }),
        method: "PATCH",
      }),
    );

    expect(response.status).toBe(401);
    expect(mocks.updateProfile).not.toHaveBeenCalled();
  });

  it("returns 400 for invalid JSON", async () => {
    const response = await PATCH(
      new Request("http://localhost/api/profile", {
        body: "{",
        method: "PATCH",
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Invalid JSON" });
  });

  it("returns 422 for invalid profile input", async () => {
    const response = await PATCH(
      new Request("http://localhost/api/profile", {
        body: JSON.stringify({ username: "bad slug" }),
        method: "PATCH",
      }),
    );

    expect(response.status).toBe(422);
    expect(mocks.updateProfile).not.toHaveBeenCalled();
  });

  it("updates the authenticated user's profile", async () => {
    const response = await PATCH(
      new Request("http://localhost/api/profile", {
        body: JSON.stringify({ name: "Yazan", username: "yazan.dev" }),
        headers: { "content-type": "application/json" },
        method: "PATCH",
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      name: "Yazan",
      username: "yazan.dev",
    });
    expect(mocks.updateProfile).toHaveBeenCalledWith("user-1", {
      name: "Yazan",
      username: "yazan.dev",
    });
  });

  it("returns 409 for duplicate usernames", async () => {
    mocks.updateProfile.mockResolvedValueOnce({
      ok: false,
      error: "Username is already taken.",
    });

    const response = await PATCH(
      new Request("http://localhost/api/profile", {
        body: JSON.stringify({ username: "yazan.dev" }),
        method: "PATCH",
      }),
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: "Username is already taken.",
    });
  });
});
