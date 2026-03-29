/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generatePrepPack } from "@/lib/meetings/prep.logic";

/**
 * GET /api/meetings/[id]/prep
 * Returns the existing prep pack text if available.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const meeting = await db.meeting.findUnique({
    where: { id },
    select: { userId: true, prepPack: true },
  });

  if (!meeting || meeting.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  return NextResponse.json({ prepPack: meeting.prepPack });
}

/**
 * POST /api/meetings/[id]/prep
 * Forces (re)generation of the prep pack via Ollama and persists it.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const result = await generatePrepPack(session.user.id, id);
    if (!result) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    return NextResponse.json({ prepPack: result.prepPack });
  } catch (err) {
    console.error("[meetings/prep] generation failed:", err);
    return NextResponse.json({ error: "Generation failed." }, { status: 502 });
  }
}
