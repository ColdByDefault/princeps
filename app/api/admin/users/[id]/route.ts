/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { setUserTier, deleteUser } from "@/lib/admin/user-management.logic";

// PATCH /api/admin/users/[id] — set tier
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const { tier } = body as Record<string, unknown>;
  if (!["free", "pro", "premium"].includes(tier as string)) {
    return NextResponse.json({ error: "Invalid tier." }, { status: 400 });
  }

  await setUserTier(id, tier as "free" | "pro" | "premium");
  return NextResponse.json({ ok: true });
}

// DELETE /api/admin/users/[id] — hard delete user
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  // Prevent self-deletion
  if (id === session.user.id) {
    return NextResponse.json(
      { error: "Cannot delete your own account." },
      { status: 400 },
    );
  }

  await deleteUser(id);
  return NextResponse.json({ ok: true });
}
