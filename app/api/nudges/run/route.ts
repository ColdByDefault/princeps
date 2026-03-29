/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { evaluateNudges } from "@/lib/nudges/evaluate.logic";

const COOKIE_NAME = "nudge_run";
const RATE_LIMIT_SECONDS = 300; // 5 minutes

// POST /api/nudges/run — evaluate and fire nudges for the current user
export async function POST() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cookieStore = await cookies();
  if (cookieStore.has(COOKIE_NAME)) {
    return NextResponse.json({ skipped: true });
  }

  // Evaluate in background — do not await so the response is fast
  void evaluateNudges(session.user.id).catch((err) =>
    console.error("[nudges/run] evaluation failed:", err),
  );

  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, "1", {
    httpOnly: true,
    sameSite: "strict",
    path: "/",
    maxAge: RATE_LIMIT_SECONDS,
  });

  return response;
}
