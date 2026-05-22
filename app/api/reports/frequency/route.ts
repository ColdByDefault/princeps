/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.4
 * @since canary-v1.1.4
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/core/auth/auth";
import { getToolFrequency } from "@/lib/features/reports";

// GET /api/reports/frequency — aggregated tool call frequency for the current user
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const frequency = await getToolFrequency(session.user.id);
  return NextResponse.json({ frequency });
}
