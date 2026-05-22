import { beforeEach, describe, expect, it, vi } from "vitest";

type Session = {
  user: {
    id: string;
  };
};

type HeadersProvider = () => Promise<Headers>;
type GetSession = (args: { headers: Headers }) => Promise<Session | null>;

const mocks = vi.hoisted(() => ({
  getSession: vi.fn<GetSession>(),
  getUserPreferences: vi.fn<() => Promise<{ assistantName: string | null }>>(),
  headers: vi.fn<HeadersProvider>(),
  updateUserLocation: vi.fn<
    (
      userId: string,
      location: string,
      locationLat: number,
      locationLon: number,
    ) => Promise<void>
  >(),
  updateUserPreferences: vi.fn<
    (userId: string, patch: Record<string, unknown>) => Promise<void>
  >(),
  updateUserTimezone: vi.fn<(userId: string, timezone: string) => Promise<void>>(),
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

vi.mock("@/lib/platform/settings", () => ({
  ADDRESS_STYLES: ["firstname", "formal_male", "formal_female", "informal"],
  ASSISTANT_TONES: [
    "professional",
    "friendly",
    "casual",
    "witty",
    "motivational",
    "concise",
  ],
  RESPONSE_LENGTHS: ["brief", "balanced", "detailed"],
  getUserPreferences: mocks.getUserPreferences,
  updateUserLocation: mocks.updateUserLocation,
  updateUserPreferences: mocks.updateUserPreferences,
  updateUserTimezone: mocks.updateUserTimezone,
}));

vi.mock("@/lib/ai/tools", () => ({
  TOOL_REGISTRY: [
    { type: "function", function: { name: "create_task" } },
    { type: "function", function: { name: "list_contacts" } },
  ],
}));

import { GET, PATCH } from "@/app/api/settings/route";

describe("/api/settings route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.headers.mockResolvedValue(new Headers());
    mocks.getSession.mockResolvedValue({ user: { id: "user-1" } });
    mocks.getUserPreferences.mockResolvedValue({ assistantName: "Princeps" });
    mocks.updateUserPreferences.mockResolvedValue();
    mocks.updateUserTimezone.mockResolvedValue();
    mocks.updateUserLocation.mockResolvedValue();
  });

  it("returns assistant settings for the authenticated user", async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      assistantName: "Princeps",
    });
    expect(mocks.getUserPreferences).toHaveBeenCalledWith("user-1");
  });

  it("returns 401 without a session", async () => {
    mocks.getSession.mockResolvedValueOnce(null);

    const response = await GET();

    expect(response.status).toBe(401);
    expect(mocks.getUserPreferences).not.toHaveBeenCalled();
  });

  it("patches sanitized preference, timezone, and location settings", async () => {
    const response = await PATCH(
      new Request("http://localhost/api/settings", {
        body: JSON.stringify({
          language: "en",
          theme: "dark",
          notificationsEnabled: false,
          assistantName: "  Chief  ",
          assistantTone: "professional",
          addressStyle: "firstname",
          responseLength: "brief",
          disabledTools: ["create_task", "unknown", 7],
          customSystemPrompt: "  Be concise.  ",
          autoBriefingEnabled: true,
          reportsEnabled: false,
          overdueTaskNudgesEnabled: true,
          timezone: "Europe/Paris",
          location: "Paris",
          locationLat: 48.8566,
          locationLon: 2.3522,
        }),
        headers: { "content-type": "application/json" },
        method: "PATCH",
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(mocks.updateUserPreferences).toHaveBeenCalledWith("user-1", {
      language: "en",
      theme: "dark",
      notificationsEnabled: false,
      assistantName: "Chief",
      assistantTone: "professional",
      addressStyle: "firstname",
      responseLength: "brief",
      disabledTools: ["create_task"],
      customSystemPrompt: "Be concise.",
      autoBriefingEnabled: true,
      reportsEnabled: false,
      overdueTaskNudgesEnabled: true,
    });
    expect(mocks.updateUserTimezone).toHaveBeenCalledWith(
      "user-1",
      "Europe/Paris",
    );
    expect(mocks.updateUserLocation).toHaveBeenCalledWith(
      "user-1",
      "Paris",
      48.8566,
      2.3522,
    );
  });

  it("returns ok without writes when the patch has no recognized settings", async () => {
    const response = await PATCH(
      new Request("http://localhost/api/settings", {
        body: JSON.stringify({ theme: "sepia" }),
        method: "PATCH",
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(mocks.updateUserPreferences).not.toHaveBeenCalled();
    expect(mocks.updateUserTimezone).not.toHaveBeenCalled();
    expect(mocks.updateUserLocation).not.toHaveBeenCalled();
  });

  it("returns 400 for invalid timezone values", async () => {
    mocks.updateUserTimezone.mockRejectedValueOnce(new Error("invalid"));

    const response = await PATCH(
      new Request("http://localhost/api/settings", {
        body: JSON.stringify({ timezone: "Mars/Base" }),
        method: "PATCH",
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid timezone value.",
    });
  });
});
