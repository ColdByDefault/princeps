/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import { useCallback, useRef, useState } from "react";

export type VoiceState = "idle" | "recording" | "transcribing";

interface UseVoiceInputOptions {
  onTranscribed: (text: string) => void;
  onError: (message: string) => void;
  /** Maximum recording duration in milliseconds. Default: 60 000. */
  maxDurationMs?: number;
}

export function useVoiceInput({
  onTranscribed,
  onError,
  maxDurationMs = 60_000,
}: UseVoiceInputOptions) {
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopRecording = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const startRecording = useCallback(async () => {
    if (voiceState !== "idle") return;

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        onError("micPermissionDenied");
      } else {
        onError("transcribeError");
      }
      return;
    }

    streamRef.current = stream;
    chunksRef.current = [];

    // Pick the first MIME type the browser supports (codec-qualified for
    // better quality; falls back to plain base types then the browser default).
    const mimeTypeCandidates = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus",
      "audio/ogg",
      "audio/mp4",
    ];
    const mimeType =
      mimeTypeCandidates.find((t) => MediaRecorder.isTypeSupported(t)) ?? "";

    const mr = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    mediaRecorderRef.current = mr;

    // Use a timeslice so ondataavailable fires periodically — guarantees data
    // arrives even on very short recordings or slow browsers.
    mr.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    mr.onstop = async () => {
      // Stop all tracks to release the microphone indicator in the browser
      stream.getTracks().forEach((t) => t.stop());
      streamRef.current = null;

      // Use the actual recorded MIME type (may include codec qualifier)
      const recordedMime = mr.mimeType || mimeType || "audio/webm";
      const blob = new Blob(chunksRef.current, { type: recordedMime });

      // Derive correct extension so Whisper can identify the container format
      const baseMime = recordedMime.split(";")[0].trim();
      const ext = baseMime.includes("ogg")
        ? "ogg"
        : baseMime.includes("mp4")
          ? "mp4"
          : "webm";

      setVoiceState("transcribing");

      try {
        const form = new FormData();
        form.append(
          "audio",
          new File([blob], `recording.${ext}`, { type: baseMime }),
        );

        const res = await fetch("/api/chat/transcribe", {
          method: "POST",
          body: form,
        });

        let data: { text?: string; error?: string };
        try {
          data = (await res.json()) as { text?: string; error?: string };
        } catch {
          throw new Error("transcribeError");
        }

        if (!res.ok || !data.text) {
          throw new Error(data.error ?? "transcribeError");
        }

        onTranscribed(data.text);
      } catch (err) {
        onError(err instanceof Error ? err.message : "transcribeError");
      } finally {
        setVoiceState("idle");
        mediaRecorderRef.current = null;
      }
    };

    // 250 ms timeslice — small enough to not lose data if stop() is called
    // quickly; large enough that we don't generate excessive chunks.
    mr.start(250);
    setVoiceState("recording");

    timeoutRef.current = setTimeout(() => {
      stopRecording();
    }, maxDurationMs);
  }, [voiceState, onTranscribed, onError, maxDurationMs, stopRecording]);

  return { voiceState, startRecording, stopRecording };
}
