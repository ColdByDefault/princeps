/**
 * Dev-only file-based mailbox for password reset links.
 * Writes to .next/reset-mailbox.json so it survives hot reloads.
 * This module is never imported in production — the API route
 * returns 404 when NODE_ENV !== "development".
 */

import fs from "fs";
import path from "path";

type ResetEntry = {
  email: string;
  url: string;
  at: string;
};

const MAILBOX_PATH = path.join(process.cwd(), ".next", "reset-mailbox.json");
const MAX_ENTRIES = 20;

function readEntries(): ResetEntry[] {
  try {
    const raw = fs.readFileSync(MAILBOX_PATH, "utf-8");
    return JSON.parse(raw) as ResetEntry[];
  } catch {
    return [];
  }
}

function writeEntries(entries: ResetEntry[]) {
  try {
    fs.mkdirSync(path.dirname(MAILBOX_PATH), { recursive: true });
    fs.writeFileSync(MAILBOX_PATH, JSON.stringify(entries, null, 2), "utf-8");
  } catch {
    // silently ignore write failures in dev
  }
}

export function storeResetLink(email: string, url: string) {
  const entries = readEntries();
  entries.unshift({ email, url, at: new Date().toISOString() });
  writeEntries(entries.slice(0, MAX_ENTRIES));
}

export function getResetLinks(): ResetEntry[] {
  return readEntries();
}
