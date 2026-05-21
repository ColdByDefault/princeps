/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version beta
 * @since beta
 * @module
 * @description
 */

import "server-only";

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/core/auth/auth";
import { enforceVoiceRequests, recordVoiceDuration } from "@/lib/platform/tiers";
import { getOpenAISettings } from "@/lib/ai/llm-providers/openai/openai-settings";

/** Maximum accepted audio size: 24 MB (Whisper server limit is 25 MB). */
const MAX_AUDIO_BYTES = 24 * 1024 * 1024;
const MAX_CLIENT_DURATION_SECONDS = 10 * 60;

function parseClientDurationSeconds(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return undefined;

  const durationMs = Number(value);
  if (!Number.isFinite(durationMs) || durationMs <= 0) return undefined;

  return Math.min(durationMs / 1_000, MAX_CLIENT_DURATION_SECONDS);
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const voiceCheck = await enforceVoiceRequests(session.user.id);
  if (!voiceCheck.allowed) {
    return NextResponse.json({ error: voiceCheck.reason }, { status: 403 });
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

  const clientDurationSeconds = parseClientDurationSeconds(
    formData.get("durationMs"),
  );

  let settings: ReturnType<typeof getOpenAISettings>;
  try {
    settings = getOpenAISettings();
  } catch {
    return NextResponse.json(
      { error: "Transcription service is not configured" },
      { status: 503 },
    );
  }

  // Build the multipart form for Whisper.
  // Strip any codec qualifier (e.g. "audio/webm;codecs=opus" → "audio/webm")
  // so Whisper receives a clean MIME type. Also derive the correct extension
  // from the base MIME type — Whisper uses the filename to detect the container.
  const rawMime = audioField.type || "audio/webm";
  const baseMime = rawMime.split(";")[0].trim();
  const ext = baseMime.includes("ogg")
    ? "ogg"
    : baseMime.includes("mp4")
      ? "mp4"
      : "webm";

  const whisperForm = new FormData();
  whisperForm.append(
    "file",
    new File([audioField], `recording.${ext}`, { type: baseMime }),
  );
  whisperForm.append("model", "gpt-4o-mini-transcribe");
  whisperForm.append("response_format", "json");

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
    let whisperError = "Transcription failed.";
    try {
      const errBody = (await whisperRes.json()) as {
        error?: { message?: string };
      };
      if (errBody?.error?.message) whisperError = errBody.error.message;
    } catch {
      // ignore unparseable body
    }
    return NextResponse.json({ error: whisperError }, { status: 502 });
  }

  const result = (await whisperRes.json()) as {
    text?: string;
    duration?: number;
    usage?: { seconds?: number };
  };

  if (typeof result.text !== "string") {
    return NextResponse.json(
      { error: "Unexpected transcription response" },
      { status: 502 },
    );
  }

  // Track audio duration fire-and-forget — never stalls the user response.
  const durationSeconds =
    typeof result.duration === "number" && result.duration > 0
      ? result.duration
      : typeof result.usage?.seconds === "number" && result.usage.seconds > 0
        ? result.usage.seconds
        : clientDurationSeconds;

  if (durationSeconds) {
    recordVoiceDuration(session.user.id, durationSeconds).catch(() => {});
  }

  return NextResponse.json({ text: result.text.trim() });
}
