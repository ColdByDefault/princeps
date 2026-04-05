/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import { useCallback, useState } from "react";

export interface ChatSettings {
  temperature: number;
  timeoutMs: number;
}

export const CHAT_SETTINGS_DEFAULTS: ChatSettings = {
  temperature: 0.7,
  timeoutMs: 30_000,
};

const STORAGE_KEY = "c-sweet:chat-settings";

function load(): ChatSettings {
  if (typeof window === "undefined") return CHAT_SETTINGS_DEFAULTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return CHAT_SETTINGS_DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<ChatSettings>;
    return {
      temperature:
        typeof parsed.temperature === "number"
          ? Math.min(2, Math.max(0, parsed.temperature))
          : CHAT_SETTINGS_DEFAULTS.temperature,
      timeoutMs:
        typeof parsed.timeoutMs === "number"
          ? Math.min(120_000, Math.max(5_000, parsed.timeoutMs))
          : CHAT_SETTINGS_DEFAULTS.timeoutMs,
    };
  } catch {
    return CHAT_SETTINGS_DEFAULTS;
  }
}

export function useChatSettings() {
  const [settings, setSettings] = useState<ChatSettings>(() => load());

  const update = useCallback((next: Partial<ChatSettings>) => {
    setSettings((prev) => {
      const merged = { ...prev, ...next };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      return merged;
    });
  }, []);

  const reset = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setSettings(CHAT_SETTINGS_DEFAULTS);
  }, []);

  return { settings, update, reset };
}
