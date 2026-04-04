/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { generateDailyGreeting } from "@/lib/notifications/greeting.logic";

// POST /api/notifications/greeting — trigger daily greeting generation
// Returns { created: boolean, notification: NotificationRecord | null }
// created: false means a greeting for today already exists (client no-ops)
export async function POST() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await generateDailyGreeting(session.user.id);
  return NextResponse.json(result);
}
