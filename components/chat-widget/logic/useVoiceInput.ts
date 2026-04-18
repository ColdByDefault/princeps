/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version beta
 * @since beta
 * @module
 * @description
 */

"use client";

import { useCallback, useRef, useState } from "react";

export type VoiceState = "idle" | "recording" | "transcribing";

/** RMS (0–128 scale) above which we consider the user to be speaking. */
const SPEECH_THRESHOLD = 12;

interface UseVoiceInputOptions {
  /** Called when the user manually stops recording — text goes into the input field. */
  onTranscribed: (text: string) => void;
  /** Called when silence auto-stops recording — text is sent directly. */
  onAutoSend?: (text: string) => void;
  onError: (message: string) => void;
  /** Maximum recording duration in milliseconds. Default: 60 000. */
  maxDurationMs?: number;
  /** Milliseconds of silence that trigger auto-stop. Default: 1 500. */
  silenceDurationMs?: number;
}

export function useVoiceInput({
  onTranscribed,
  onAutoSend,
  onError,
  maxDurationMs = 60_000,
  silenceDurationMs = 1_500,
}: UseVoiceInputOptions) {
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const silenceRafRef = useRef<number | null>(null);
  /** True once the user has spoken at least once — prevents firing on initial breath noise. */
  const primedRef = useRef(false);
  /** True when the stop was triggered by silence (auto-send path). */
  const autoStopRef = useRef(false);

  const cleanupAudio = useCallback(() => {
    if (silenceRafRef.current !== null) {
      cancelAnimationFrame(silenceRafRef.current);
      silenceRafRef.current = null;
    }
    if (silenceTimerRef.current !== null) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
  }, []);

  const stopRecordingInternal = useCallback(
    (isAutoStop: boolean) => {
      autoStopRef.current = isAutoStop;
      cleanupAudio();
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
    },
    [cleanupAudio],
  );

  /** Public stop — always treated as manual (no auto-send). */
  const stopRecording = useCallback(() => {
    stopRecordingInternal(false);
  }, [stopRecordingInternal]);

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
    primedRef.current = false;
    autoStopRef.current = false;

    // ── Silence detection via Web Audio ──────────────────────────────────────
    try {
      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      audioCtx.createMediaStreamSource(stream).connect(analyser);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const checkSilence = () => {
        if (
          !mediaRecorderRef.current ||
          mediaRecorderRef.current.state !== "recording"
        )
          return;

        analyser.getByteTimeDomainData(dataArray);
        const rms = Math.sqrt(
          dataArray.reduce((s, v) => s + (v - 128) ** 2, 0) / dataArray.length,
        );

        if (rms > SPEECH_THRESHOLD) {
          // User is speaking — mark as primed and cancel any pending silence timer
          primedRef.current = true;
          if (silenceTimerRef.current !== null) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
          }
        } else if (primedRef.current && silenceTimerRef.current === null) {
          // Silence started after the user spoke — start the countdown
          silenceTimerRef.current = setTimeout(() => {
            silenceTimerRef.current = null;
            stopRecordingInternal(true);
          }, silenceDurationMs);
        }

        silenceRafRef.current = requestAnimationFrame(checkSilence);
      };

      silenceRafRef.current = requestAnimationFrame(checkSilence);
    } catch {
      // AudioContext unavailable — silence detection disabled, manual-only
    }

    // Pick the first MIME type the browser supports
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

    mr.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    mr.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      streamRef.current = null;

      const recordedMime = mr.mimeType || mimeType || "audio/webm";
      const blob = new Blob(chunksRef.current, { type: recordedMime });
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

        // Auto-stop path → send directly; manual stop → populate input for review
        if (autoStopRef.current && onAutoSend) {
          onAutoSend(data.text);
        } else {
          onTranscribed(data.text);
        }
      } catch (err) {
        onError(err instanceof Error ? err.message : "transcribeError");
      } finally {
        setVoiceState("idle");
        mediaRecorderRef.current = null;
      }
    };

    mr.start(250);
    setVoiceState("recording");

    timeoutRef.current = setTimeout(() => {
      stopRecordingInternal(true);
    }, maxDurationMs);
  }, [
    voiceState,
    onTranscribed,
    onAutoSend,
    onError,
    maxDurationMs,
    silenceDurationMs,
    stopRecordingInternal,
  ]);

  return { voiceState, startRecording, stopRecording };
}
