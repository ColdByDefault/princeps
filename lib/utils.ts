import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { type ZodError } from "zod";

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
