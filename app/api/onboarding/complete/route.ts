/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import { isSupportedLanguage } from "@/types/i18n";
import { DEFAULT_PREFERENCES } from "@/types/settings";

// POST /api/onboarding/complete — mark onboarding done and save wizard choices
export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const { language, assistantName } = body as Record<string, unknown>;

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { preferences: true },
  });

  const existing =
    user?.preferences && typeof user.preferences === "object"
      ? (user.preferences as Record<string, unknown>)
      : {};

  const merged: Record<string, unknown> = { ...existing, onboardingDone: true };

  if (typeof language === "string" && isSupportedLanguage(language)) {
    merged["language"] = language;
  }
  if (typeof assistantName === "string" && assistantName.trim()) {
    merged["assistantName"] =
      assistantName.trim().slice(0, 30) || DEFAULT_PREFERENCES.assistantName;
  }

  await db.user.update({
    where: { id: session.user.id },
    data: { preferences: merged as Prisma.InputJsonObject },
  });

  const response = NextResponse.json({ ok: true });
  response.cookies.set("ob_done", "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}
