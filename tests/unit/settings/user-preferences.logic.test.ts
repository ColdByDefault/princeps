import { beforeEach, describe, expect, it, vi } from "vitest";

type UserFindUniqueArgs = {
  where: { id: string };
  select: { preferences: true };
};

type UserUpdateArgs = {
  where: { id: string };
  data: Record<string, unknown>;
};

const mocks = vi.hoisted(() => ({
  userFindUnique: vi.fn<
    (args: UserFindUniqueArgs) => Promise<{ preferences: unknown } | null>
  >(),
  userUpdate: vi.fn<(args: UserUpdateArgs) => Promise<unknown>>(),
}));

vi.mock("@/lib/core/db", () => ({
  db: {
    user: {
      findUnique: mocks.userFindUnique,
      update: mocks.userUpdate,
    },
  },
}));

import {
  parseUserPreferences,
  updateUserPreferences,
  updateUserTimezone,
} from "@/lib/platform/settings/user-preferences.logic";

describe("user preference logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.userFindUnique.mockResolvedValue({
      preferences: {
        language: "de",
        assistantName: "Old",
        disabledTools: ["create_task"],
      },
    });
    mocks.userUpdate.mockResolvedValue({});
  });

  it("parses and sanitizes raw preference values", () => {
    const parsed = parseUserPreferences({
      language: "en",
      theme: "dark",
      notificationsEnabled: false,
      location: "  Paris  ",
      locationLat: 48.8566,
      locationLon: 2.3522,
      assistantName: "  Chief  ",
      assistantTone: "professional",
      addressStyle: "firstname",
      responseLength: "brief",
      disabledTools: ["create_task", 42, "list_contacts"],
      customSystemPrompt: "  Be concise.  ",
      autoBriefingEnabled: true,
      reportsEnabled: false,
      overdueTaskNudgesEnabled: true,
      signalTopics: [" AI ", "", "Energy"],
    });

    expect(parsed).toMatchObject({
      language: "en",
      theme: "dark",
      notificationsEnabled: false,
      location: "Paris",
      locationLat: 48.8566,
      locationLon: 2.3522,
      assistantName: "Chief",
      assistantTone: "professional",
      addressStyle: "firstname",
      responseLength: "brief",
      disabledTools: ["create_task", "list_contacts"],
      customSystemPrompt: "Be concise.",
      autoBriefingEnabled: true,
      reportsEnabled: false,
      overdueTaskNudgesEnabled: true,
      signalTopics: ["AI", "Energy"],
    });
  });

  it("updates preferences by merging with the current stored values", async () => {
    await updateUserPreferences("user-preferences-1", {
      language: "en",
      assistantName: null,
      reportsEnabled: true,
    });

    expect(mocks.userFindUnique).toHaveBeenCalledWith({
      where: { id: "user-preferences-1" },
      select: { preferences: true },
    });
    expect(mocks.userUpdate).toHaveBeenCalledWith({
      where: { id: "user-preferences-1" },
      data: {
        preferences: {
          language: "en",
          disabledTools: ["create_task"],
          customSystemPrompt: null,
          reportsEnabled: true,
        },
      },
    });
  });

  it("validates timezone updates", async () => {
    await updateUserTimezone("user-1", "Europe/Berlin");

    expect(mocks.userUpdate).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { timezone: "Europe/Berlin" },
    });

    await expect(updateUserTimezone("user-1", "Mars/Base")).rejects.toThrow(
      "Invalid timezone value.",
    );
  });
});
