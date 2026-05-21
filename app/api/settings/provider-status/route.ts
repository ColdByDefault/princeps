/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version beta
 * @since beta
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/core/auth/auth";
import { getProviderStatus } from "@/lib/platform/settings";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = await getProviderStatus();
  return NextResponse.json(status);
}
