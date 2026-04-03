/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { updateUserPreferences } from "@/lib/settings/user-preferences.logic";
import { isSupportedLanguage, type AppLanguage } from "@/types/i18n";

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

  const { language, theme } = body as Record<string, unknown>;
  const patch: { language?: AppLanguage; theme?: string } = {};

  if (isSupportedLanguage(language as string)) {
    patch.language = language as AppLanguage;
  }
  if (
    typeof theme === "string" &&
    ["light", "dark", "system"].includes(theme)
  ) {
    patch.theme = theme;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ ok: true });
  }

  await updateUserPreferences(session.user.id, patch);
  return NextResponse.json({ ok: true });
}
