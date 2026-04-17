/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * SPDX-License-Identifier: Elastic-2.0
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { listNotifications, deleteAllNotifications } from "@/lib/notifications";

// GET /api/notifications — list all non-dismissed notifications
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const notifications = await listNotifications(session.user.id);
  return NextResponse.json({ notifications });
}

// DELETE /api/notifications — soft-delete all notifications (clear all)
export async function DELETE() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await deleteAllNotifications(session.user.id);
  return new NextResponse(null, { status: 204 });
}
