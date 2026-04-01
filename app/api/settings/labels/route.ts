/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createLabel } from "@/lib/labels/create.logic";
import { listLabels } from "@/lib/labels/list.logic";
import { LabelCreateSchema } from "@/lib/labels/schemas";
import { zodErrorMessage } from "@/lib/utils";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const labels = await listLabels(session.user.id);
  return NextResponse.json({ labels });
}

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

  const parsed = LabelCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: zodErrorMessage(parsed.error) },
      { status: 400 },
    );
  }

  const result = await createLabel(session.user.id, parsed.data.name);
  if (!result.ok) {
    return NextResponse.json(
      { error: "A label with this name already exists." },
      { status: 409 },
    );
  }

  return NextResponse.json({ label: result.label }, { status: 201 });
}
