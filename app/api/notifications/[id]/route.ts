/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { updateNotification } from "@/lib/notifications/update.logic";

type Params = { params: Promise<{ id: string }> };

// PATCH /api/notifications/[id] — mark read and/or dismissed
export async function PATCH(req: Request, { params }: Params) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await req.json()) as { read?: boolean; dismissed?: boolean };

  if (
    typeof body !== "object" ||
    body === null ||
    (body.read === undefined && body.dismissed === undefined)
  ) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const input: {
    id: string;
    userId: string;
    read?: boolean;
    dismissed?: boolean;
  } = {
    id,
    userId: session.user.id,
  };
  if (body.read !== undefined) input.read = body.read;
  if (body.dismissed !== undefined) input.dismissed = body.dismissed;

  const updated = await updateNotification(input);

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
