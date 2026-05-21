import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { type ZodError } from "zod";
import { format, parseISO } from "date-fns";
import { de, enUS } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import packageJson from "../package.json";

/**
 * Gets the version from package.json
 * @returns The current version of the application
 */
export function getVersion(): string {
  return packageJson.version;
}

/** Returns the first Zod validation error message, or a generic fallback. */
export function zodErrorMessage(err: ZodError): string {
  return err.issues[0]?.message ?? "Invalid input.";
}

/** Format an ISO date string as "d MMM yyyy" (e.g. "9 Apr 2026"). Locale-aware. */
export function formatDate(iso: string, locale?: string): string {
  return format(parseISO(iso), "d MMM yyyy", {
    locale: locale === "de" ? de : enUS,
  });
}

/**
 * Format an ISO date string with weekday + time
 * (e.g. "Thu, 9 Apr, 14:30"). Locale-aware.
 */
export function formatDateTime(iso: string, locale?: string): string {
  return format(parseISO(iso), "EEE, d MMM yyyy, HH:mm", {
    locale: locale === "de" ? de : enUS,
  });
}
