/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { revokeShareToken } from "@/lib/share/revoke.logic";
import { resolveShareToken } from "@/lib/share/get.logic";

// GET /api/share/[tokenId] — public, no auth required
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ tokenId: string }> },
) {
  const { tokenId } = await params;
  const data = await resolveShareToken(tokenId);

  if (!data) {
    return NextResponse.json(
      { error: "This link is invalid or has expired." },
      { status: 404 },
    );
  }

  return NextResponse.json(data);
}

// DELETE /api/share/[tokenId] — auth required
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ tokenId: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { tokenId } = await params;
  const revoked = await revokeShareToken(session.user.id, tokenId);

  if (!revoked) {
    return NextResponse.json(
      { error: "Token not found or already revoked." },
      { status: 404 },
    );
  }

  return NextResponse.json({ success: true });
}
