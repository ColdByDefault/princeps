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

    let mimeType = "audio/webm";
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = "audio/ogg";
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "";
      }
    }

    const mr = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    mediaRecorderRef.current = mr;

    mr.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    mr.onstop = async () => {
      // Stop all tracks to release the microphone indicator in the browser
      stream.getTracks().forEach((t) => t.stop());
      streamRef.current = null;

      const blob = new Blob(chunksRef.current, {
        type: mr.mimeType || "audio/webm",
      });

      setVoiceState("transcribing");

      try {
        const form = new FormData();
        form.append(
          "audio",
          new File([blob], "recording.webm", { type: blob.type }),
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

    mr.start();
    setVoiceState("recording");

    timeoutRef.current = setTimeout(() => {
      stopRecording();
    }, maxDurationMs);
  }, [voiceState, onTranscribed, onError, maxDurationMs, stopRecording]);

  return { voiceState, startRecording, stopRecording };
}
