/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listKnowledgeDocuments } from "@/lib/knowledge/list.logic";
import {
  uploadKnowledgeDocument,
  UploadError,
} from "@/lib/knowledge/upload.logic";

// GET /api/knowledge/documents — list documents for the current user
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const documents = await listKnowledgeDocuments(session.user.id);
  return NextResponse.json({ documents });
}

// POST /api/knowledge/documents — upload a .txt or .md file
export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext !== "txt" && ext !== "md") {
    return NextResponse.json(
      { error: "Only .txt and .md files are accepted." },
      { status: 400 },
    );
  }

  let rawText: string;
  try {
    rawText = await file.text();
  } catch {
    return NextResponse.json(
      { error: "Could not read file contents." },
      { status: 400 },
    );
  }

  try {
    const result = await uploadKnowledgeDocument(
      session.user.id,
      file.name,
      rawText,
    );
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    if (err instanceof UploadError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[knowledge/documents POST]", err);
    return NextResponse.json(
      { error: "Upload failed. Please try again." },
      { status: 500 },
    );
  }
}
