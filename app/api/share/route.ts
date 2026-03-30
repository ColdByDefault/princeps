/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createShareToken } from "@/lib/share/create.logic";
import { getActiveShareToken } from "@/lib/share/get.logic";
import type { ShareableFieldKey } from "@/lib/share/types";
import { SHAREABLE_FIELD_KEYS } from "@/lib/share/types";

// GET /api/share — return the current active token for the user
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = await getActiveShareToken(session.user.id);
  return NextResponse.json({ token: token ?? null });
}

// POST /api/share — create a new share token (revokes existing)
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

  if (
    typeof body !== "object" ||
    body === null ||
    !Array.isArray((body as Record<string, unknown>).fields)
  ) {
    return NextResponse.json(
      { error: "Body must be { fields: string[] }." },
      { status: 400 },
    );
  }

  const rawFields = (body as { fields: unknown[] }).fields;
  const validSet = new Set<string>(SHAREABLE_FIELD_KEYS);
  const fields = rawFields.filter(
    (f): f is ShareableFieldKey => typeof f === "string" && validSet.has(f),
  );

  if (fields.length === 0) {
    return NextResponse.json(
      { error: "At least one valid field is required." },
      { status: 400 },
    );
  }

  const token = await createShareToken(session.user.id, fields);
  return NextResponse.json({ token }, { status: 201 });
}
