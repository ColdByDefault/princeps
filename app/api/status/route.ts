/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  OLLAMA_BASE_URL,
  OLLAMA_MODEL,
  OLLAMA_EMBED_MODEL,
} from "@/lib/chat/ollama";

// GET /api/status — returns Ollama reachability and configured model names.
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let ollamaOnline = false;

  try {
    const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      signal: AbortSignal.timeout(3000),
    });
    ollamaOnline = res.ok;
  } catch {
    ollamaOnline = false;
  }

  return NextResponse.json({
    ollama: ollamaOnline,
    chatModel: OLLAMA_MODEL,
    embedModel: OLLAMA_EMBED_MODEL,
  });
}
