/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version beta
 * @since beta
 * @module
 * @description
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { listReports, deleteAllReports } from "@/lib/reports";

// GET /api/reports — list all reports for the current user
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const reports = await listReports(session.user.id);
  return NextResponse.json({ reports });
}

// DELETE /api/reports — delete ALL reports for the current user
export async function DELETE() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const count = await deleteAllReports(session.user.id);
  return NextResponse.json({ deleted: count });
}
