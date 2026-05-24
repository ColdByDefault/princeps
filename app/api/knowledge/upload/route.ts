/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.8
 * @since beta
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/core/auth/auth";
import {
  enforceKnowledgeUpload,
  createTierLimitResponse,
} from "@/lib/platform/tiers";
import {
  createKnowledgeDocument,
  createKnowledgeDocumentSchema,
} from "@/lib/features/knowledge";

// POST /api/knowledge/upload — parse a text/markdown file and index it
//
// Accepts multipart/form-data with two fields:
//   file  : the uploaded file (text/plain or text/markdown)
//   name  : optional display name override (falls back to file.name)
export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse multipart form data
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid multipart form data." },
      { status: 400 },
    );
  }

  const fileEntry = formData.get("file");
  if (!(fileEntry instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  // Read the file content as text (enforces text-only; binary files are rejected)
  let content: string;
  try {
    content = await fileEntry.text();
  } catch {
    return NextResponse.json(
      { error: "Could not read file content." },
      { status: 400 },
    );
  }

  const name =
    typeof formData.get("name") === "string" &&
    (formData.get("name") as string).trim().length > 0
      ? (formData.get("name") as string).trim()
      : fileEntry.name;

  // Validate input shape
  const parsed = createKnowledgeDocumentSchema.safeParse({ name, content });
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  // Tier enforcement (file size + at-rest count + lifetime chars)
  const enforcement = await enforceKnowledgeUpload(
    session.user.id,
    fileEntry.size,
    content.length,
  );
  if (!enforcement.allowed) {
    return createTierLimitResponse(enforcement.reason);
  }

  // Process and persist
  try {
    const document = await createKnowledgeDocument(
      session.user.id,
      parsed.data,
    );
    return NextResponse.json({ document }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    const normalized = message.toLowerCase();
    const isProviderError =
      normalized.includes("embed") ||
      normalized.includes("provider") ||
      normalized.includes("api key");
    const errorName = err instanceof Error ? err.name : "UnknownError";

    console.error("[knowledge/upload] createKnowledgeDocument failed", {
      errorName,
      isProviderError,
    });

    if (isProviderError) {
      return NextResponse.json(
        { error: "Embedding provider error." },
        { status: 502 },
      );
    }
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }
}
