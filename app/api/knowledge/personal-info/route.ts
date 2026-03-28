/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getPersonalInfo,
  upsertPersonalInfo,
  type PersonalInfoFields,
} from "@/lib/knowledge/personal-info.logic";

// GET /api/knowledge/personal-info
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const fields = await getPersonalInfo(session.user.id);
  return NextResponse.json({ fields: fields ?? {} });
}

// PATCH /api/knowledge/personal-info
export async function PATCH(req: Request) {
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

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return NextResponse.json(
      { error: "Body must be a JSON object." },
      { status: 400 },
    );
  }

  await upsertPersonalInfo(session.user.id, body as PersonalInfoFields);

  return NextResponse.json({ success: true });
}
