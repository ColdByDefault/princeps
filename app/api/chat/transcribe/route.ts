/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 *
 * POST /api/chat/transcribe
 * Body: multipart/form-data — field "audio" containing the recorded audio blob
 * Response: { text: string } | { error: string }
 *
 * Transcribes audio via the OpenAI Whisper API.
 * Scoped to authenticated users only; no quota gate beyond auth.
 */

import "server-only";

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getOpenAISettings } from "@/lib/llm-providers/openai/openai-settings";

/** Maximum accepted audio size: 24 MB (Whisper server limit is 25 MB). */
const MAX_AUDIO_BYTES = 24 * 1024 * 1024;

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const audioField = formData.get("audio");
  if (!(audioField instanceof Blob)) {
    return NextResponse.json(
      { error: "Missing or invalid audio field" },
      { status: 400 },
    );
  }

  if (audioField.size > MAX_AUDIO_BYTES) {
    return NextResponse.json(
      { error: "Audio file too large. Maximum size is 24 MB." },
      { status: 413 },
    );
  }

  if (audioField.size === 0) {
    return NextResponse.json({ error: "Audio file is empty" }, { status: 400 });
  }

  let settings: ReturnType<typeof getOpenAISettings>;
  try {
    settings = getOpenAISettings();
  } catch {
    return NextResponse.json(
      { error: "Transcription service is not configured" },
      { status: 503 },
    );
  }

  // Build the multipart form for Whisper
  const whisperForm = new FormData();
  whisperForm.append(
    "file",
    new File([audioField], "recording.webm", { type: audioField.type || "audio/webm" }),
  );
  whisperForm.append("model", "whisper-1");

  const whisperUrl = `${settings.baseUrl}/audio/transcriptions`;

  let whisperRes: Response;
  try {
    whisperRes = await fetch(whisperUrl, {
      method: "POST",
      headers: { Authorization: `Bearer ${settings.apiKey}` },
      body: whisperForm,
      signal: AbortSignal.timeout(30_000),
    });
  } catch {
    return NextResponse.json(
      { error: "Transcription request failed. Please try again." },
      { status: 502 },
    );
  }

  if (!whisperRes.ok) {
    return NextResponse.json(
      { error: "Transcription failed. Please try again." },
      { status: 502 },
    );
  }

  const result = (await whisperRes.json()) as { text?: string };

  if (typeof result.text !== "string") {
    return NextResponse.json(
      { error: "Unexpected transcription response" },
      { status: 502 },
    );
  }

  return NextResponse.json({ text: result.text.trim() });
}
