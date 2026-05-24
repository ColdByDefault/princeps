/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.8
 * @since canary-v1.1.8
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/core/auth/auth";
import { listGlobalSearchData } from "@/lib/features/global-search";

// GET /api/global-search — aggregated search data for the current user
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await listGlobalSearchData(session.user.id);
  return NextResponse.json(data);
}
