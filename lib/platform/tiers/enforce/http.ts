/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.2.1
 * @since canary-v1.2.1
 */

import "server-only";

import { NextResponse } from "next/server";

// ─── Response factory ─────────────────────────────────────
export function createTierLimitResponse(reason = "Plan limit reached.") {
  return NextResponse.json({ error: reason }, { status: 403 });
}
