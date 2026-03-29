"use client";

import { useEffect } from "react";

interface NudgeTriggerProps {
  authenticated: boolean;
}

/**
 * Fires POST /api/nudges/run once on mount when the user is authenticated.
 * The route is rate-limited server-side via a short-lived cookie, so
 * repeated mounts are safe and cheap.
 */
export function NudgeTrigger({ authenticated }: NudgeTriggerProps) {
  useEffect(() => {
    if (!authenticated) return;
    void fetch("/api/nudges/run", { method: "POST" }).catch(() => {
      // Silently ignore — nudges are best-effort
    });
  }, [authenticated]);

  return null;
}
