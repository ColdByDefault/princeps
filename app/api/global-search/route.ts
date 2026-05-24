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
export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q")?.trim();

  const rawLimit = searchParams.get("limit");
  const parsedLimit = rawLimit ? Number.parseInt(rawLimit, 10) : Number.NaN;
  const hasLimit = Number.isFinite(parsedLimit);

  const options = {
    ...(query ? { query } : {}),
    ...(hasLimit ? { limit: parsedLimit } : {}),
  };

  const data = await listGlobalSearchData(session.user.id, options);

  return NextResponse.json(data);
}
