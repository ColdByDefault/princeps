/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUserPreferences } from "@/lib/settings/get.logic";
import { updateUserPreferences } from "@/lib/settings/update.logic";
import { UserPreferencesPatchSchema } from "@/lib/settings/schemas";
import { zodErrorMessage } from "@/lib/utils";
import { type UserPreferences } from "@/types/settings";

// GET /api/settings — load current user preferences
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const preferences = await getUserPreferences(session.user.id);

  return NextResponse.json({ preferences });
}

// PATCH /api/settings — update user preferences (partial)
export async function PATCH(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const parsed = UserPreferencesPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: zodErrorMessage(parsed.error) },
      { status: 400 },
    );
  }

  const result = await updateUserPreferences(
    session.user.id,
    parsed.data as Partial<UserPreferences>,
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
