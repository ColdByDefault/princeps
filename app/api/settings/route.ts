/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import {
  getUserPreferences,
  updateUserPreferences,
  updateUserTimezone,
  updateUserLocation,
  ASSISTANT_TONES,
  ADDRESS_STYLES,
  RESPONSE_LENGTHS,
  type AssistantTone,
  type AddressStyle,
  type ResponseLength,
} from "@/lib/settings/user-preferences.logic";
import { isSupportedLanguage, type AppLanguage } from "@/types/i18n";
import { TOOL_REGISTRY } from "@/lib/tools/registry";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prefs = await getUserPreferences(session.user.id);
  return NextResponse.json({ assistantName: prefs.assistantName ?? null });
}

export async function PATCH(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const {
    language,
    theme,
    notificationsEnabled,
    timezone,
    location,
    assistantName,
    assistantTone,
    addressStyle,
    responseLength,
    disabledTools,
  } = body as Record<string, unknown>;
  const patch: {
    language?: AppLanguage;
    theme?: string;
    notificationsEnabled?: boolean;
    assistantName?: string | null;
    assistantTone?: AssistantTone;
    addressStyle?: AddressStyle;
    responseLength?: ResponseLength;
    disabledTools?: string[];
  } = {};

  if (isSupportedLanguage(language as string)) {
    patch.language = language as AppLanguage;
  }
  if (
    typeof theme === "string" &&
    ["light", "dark", "system"].includes(theme)
  ) {
    patch.theme = theme;
  }
  if (typeof notificationsEnabled === "boolean") {
    patch.notificationsEnabled = notificationsEnabled;
  }
  // assistantName: null clears it, non-empty string sets it
  if (assistantName === null) {
    patch.assistantName = null;
  } else if (
    typeof assistantName === "string" &&
    assistantName.trim().length > 0
  ) {
    patch.assistantName = assistantName.trim().slice(0, 32);
  }
  if (
    typeof assistantTone === "string" &&
    ASSISTANT_TONES.includes(assistantTone as AssistantTone)
  ) {
    patch.assistantTone = assistantTone as AssistantTone;
  }
  if (
    typeof addressStyle === "string" &&
    ADDRESS_STYLES.includes(addressStyle as AddressStyle)
  ) {
    patch.addressStyle = addressStyle as AddressStyle;
  }
  if (
    typeof responseLength === "string" &&
    RESPONSE_LENGTHS.includes(responseLength as ResponseLength)
  ) {
    patch.responseLength = responseLength as ResponseLength;
  }
  if (Array.isArray(disabledTools)) {
    const knownNames = new Set(TOOL_REGISTRY.map((t) => t.function.name));
    patch.disabledTools = (disabledTools as unknown[]).filter(
      (t): t is string => typeof t === "string" && knownNames.has(t),
    );
  }

  const hasPreferencePatch = Object.keys(patch).length > 0;

  if (
    !hasPreferencePatch &&
    typeof timezone !== "string" &&
    typeof location !== "string"
  ) {
    return NextResponse.json({ ok: true });
  }

  if (hasPreferencePatch) {
    await updateUserPreferences(session.user.id, patch);
  }

  if (typeof timezone === "string") {
    try {
      await updateUserTimezone(session.user.id, timezone);
    } catch {
      return NextResponse.json(
        { error: "Invalid timezone value." },
        { status: 400 },
      );
    }
  }

  if (typeof location === "string") {
    try {
      await updateUserLocation(session.user.id, location);
    } catch {
      return NextResponse.json(
        { error: "Invalid location value." },
        { status: 400 },
      );
    }
  }

  return NextResponse.json({ ok: true });
}
