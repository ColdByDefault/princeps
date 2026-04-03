/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";

const NEXT_THEMES_STORAGE_KEY = "theme";

type Props = {
  /** Theme value saved in the DB for this user. Null means no preference set yet. */
  theme: string | null;
};

/**
 * Restores the user's theme preference from the DB on initial mount.
 * Only writes if localStorage is empty (e.g. after a full browser wipe),
 * so an explicit user choice in the current session is never overridden.
 */
export function ThemeHydrator({ theme }: Props) {
  const { setTheme } = useTheme();

  useEffect(() => {
    if (!theme) return;
    const stored = localStorage.getItem(NEXT_THEMES_STORAGE_KEY);
    if (!stored) {
      setTheme(theme);
    }
    // Intentionally empty deps: run only once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
