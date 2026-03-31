/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  CHAT_PROVIDER,
  CHAT_MODEL,
  checkChatHealth,
} from "@/lib/chat/provider";
import { OLLAMA_EMBED_MODEL } from "@/lib/chat/ollama";

// GET /api/status — returns active provider reachability and configured model names.
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const online = await checkChatHealth();

  return NextResponse.json({
    provider: CHAT_PROVIDER,
    online,
    chatModel: CHAT_MODEL,
    embedModel: OLLAMA_EMBED_MODEL,
  });
}
