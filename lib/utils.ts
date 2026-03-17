import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

import packageJson from "../package.json";

/**
 * Gets the version from package.json
 * @returns The current version of the application
 */
export function getVersion(): string {
  return packageJson.version;
}
