/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * SPDX-License-Identifier: Elastic-2.0
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { markNotificationRead, deleteNotification } from "@/lib/notifications";

type Params = { params: Promise<{ id: string }> };

// PATCH /api/notifications/[id] — mark a notification as read
export async function PATCH(_req: Request, { params }: Params) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const result = await markNotificationRead(session.user.id, id);

  if (!result) {
    return NextResponse.json(
      { error: "Notification not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({ notification: result });
}

// DELETE /api/notifications/[id] — soft-delete a single notification
export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const result = await deleteNotification(session.user.id, id);

  if (!result.ok) {
    return NextResponse.json(
      { error: "Notification not found" },
      { status: 404 },
    );
  }

  return new NextResponse(null, { status: 204 });
}
