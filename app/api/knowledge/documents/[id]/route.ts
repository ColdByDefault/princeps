/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { deleteKnowledgeDocument } from "@/lib/knowledge/delete.logic";
import { updateKnowledgeDocument } from "@/lib/knowledge/update.logic";
import { InvalidLabelSelectionError } from "@/lib/labels/shared.logic";

interface UpdateKnowledgeDocumentBody {
  labelIds?: string[];
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { error: "Missing document id." },
      { status: 400 },
    );
  }

  let body: UpdateKnowledgeDocumentBody;
  try {
    body = (await req.json()) as UpdateKnowledgeDocumentBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  try {
    const document = await updateKnowledgeDocument(session.user.id, id, body);

    if (!document) {
      return NextResponse.json(
        { error: "Document not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ document });
  } catch (error) {
    if (error instanceof InvalidLabelSelectionError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("[knowledge/documents PATCH]", error);
    return NextResponse.json(
      { error: "Failed to update document." },
      { status: 500 },
    );
  }
}

// DELETE /api/knowledge/documents/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { error: "Missing document id." },
      { status: 400 },
    );
  }

  const deleted = await deleteKnowledgeDocument(session.user.id, id);
  if (!deleted) {
    return NextResponse.json({ error: "Document not found." }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
