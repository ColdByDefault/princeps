/**
 * Message generator: merges per-namespace source files from messages-src/
 * into the monolithic messages/en.json and messages/de.json consumed by next-intl.
 *
 * Alias resolution:
 *   Any string value starting with "@" is treated as a reference to another key.
 *   Example: "@common.actions.delete" resolves to the value at common.actions.delete
 *   in the same locale's merged message object.
 *   Aliases are resolved after all namespaces are merged, so they can reference
 *   any namespace including "common".
 *
 * Usage:
 *   npx tsx scripts/generate-messages.ts           # generate
 *   npx tsx scripts/generate-messages.ts --check   # CI parity check (exit 1 if stale)
 *
 * Add to package.json:
 *   "generate:messages": "tsx scripts/generate-messages.ts",
 *   "check:messages":    "tsx scripts/generate-messages.ts --check"
 */

import fs from "fs";
import path from "path";

// ─── Config ──────────────────────────────────────────────────────────────────

const LOCALES = ["en", "de"] as const;
type Locale = (typeof LOCALES)[number];

/** Canonical namespace order — must match the original messages/*.json order. */
const NAMESPACE_ORDER = [
  "landing",
  "home",
  "notifications",
  "auth",
  "theme",
  "loading",
  "error",
  "settings",
  "calendar",
  "chatWidget",
  "shell",
  "chat",
  "decisions",
  "goals",
  "memory",
  "meetings",
  "tasks",
  "contacts",
  "labels",
  "tools",
  "profile",
  "pricing",
  "knowledge",
  "reports",
  "readingQueue",
  "briefings",
  "onboarding",
  "legal",
] as const;

const MESSAGES_SRC_DIR = path.join(process.cwd(), "messages-src");
const MESSAGES_OUT_DIR = path.join(process.cwd(), "messages");

// ─── Helpers ─────────────────────────────────────────────────────────────────

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

/** Collect all dot-path leaf keys from a nested object. */
function flattenKeys(obj: JsonValue, prefix = ""): string[] {
  if (typeof obj !== "object" || obj === null || Array.isArray(obj)) {
    return [prefix];
  }
  return Object.entries(obj).flatMap(([k, v]) =>
    flattenKeys(v, prefix ? `${prefix}.${k}` : k),
  );
}

/** Read a value at a dot-separated path from a nested object. */
function getByPath(obj: JsonValue, dotPath: string): JsonValue | undefined {
  const parts = dotPath.split(".");
  let cursor: JsonValue = obj;
  for (const part of parts) {
    if (
      typeof cursor !== "object" ||
      cursor === null ||
      Array.isArray(cursor)
    ) {
      return undefined;
    }
    cursor = (cursor as Record<string, JsonValue>)[part] as JsonValue;
  }
  return cursor;
}

/**
 * Walk a merged message object and resolve all "@<path>" alias strings.
 * Aliases are resolved against the same locale's fully-merged (but
 * pre-resolution) object, so forward references are fine.
 * Throws if an alias cannot be resolved.
 */
function resolveAliases(obj: JsonValue, root: JsonValue, at = ""): JsonValue {
  if (typeof obj === "string" && obj.startsWith("@")) {
    const aliasPath = obj.slice(1);
    const resolved = getByPath(root, aliasPath);
    if (resolved === undefined) {
      throw new Error(
        `Unresolved alias "${obj}" at key "${at}".\n` +
          `  Check that "${aliasPath}" exists in messages-src/<locale>/`,
      );
    }
    // Recursively resolve in case the target is also an alias
    return resolveAliases(resolved, root, aliasPath);
  }

  if (Array.isArray(obj)) {
    return obj.map((item, i) =>
      resolveAliases(item as JsonValue, root, `${at}[${i}]`),
    );
  }

  if (typeof obj === "object" && obj !== null) {
    const out: Record<string, JsonValue> = {};
    for (const [key, value] of Object.entries(obj)) {
      out[key] = resolveAliases(
        value as JsonValue,
        root,
        at ? `${at}.${key}` : key,
      );
    }
    return out;
  }

  return obj;
}

// ─── Core ────────────────────────────────────────────────────────────────────

function loadLocale(locale: Locale): JsonValue {
  const srcDir = path.join(MESSAGES_SRC_DIR, locale);

  if (!fs.existsSync(srcDir)) {
    console.error(`✖  Source directory not found: ${srcDir}`);
    console.error("   Run: npx tsx scripts/split-messages.ts");
    process.exit(1);
  }

  // Build ordered namespace list: canonical order first, then any extras found
  // on disk so new namespaces don't silently disappear.
  const diskFiles = fs
    .readdirSync(srcDir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(".json", ""));

  const orderedNamespaces = [
    ...NAMESPACE_ORDER.filter((ns) => diskFiles.includes(ns)),
    ...diskFiles.filter(
      (ns) => !(NAMESPACE_ORDER as readonly string[]).includes(ns),
    ),
  ];

  const missing = NAMESPACE_ORDER.filter((ns) => !diskFiles.includes(ns));
  if (missing.length > 0) {
    console.error(
      `✖  Missing namespace files for locale "${locale}": ${missing.join(", ")}`,
    );
    process.exit(1);
  }

  const merged: Record<string, JsonValue> = {};
  for (const ns of orderedNamespaces) {
    const filePath = path.join(srcDir, `${ns}.json`);
    const raw = JSON.parse(fs.readFileSync(filePath, "utf8")) as JsonValue;
    merged[ns] = raw;
  }

  return resolveAliases(merged, merged) as JsonValue;
}

function generate(check: boolean): void {
  const results = Object.fromEntries(
    LOCALES.map((locale) => [locale, loadLocale(locale)]),
  ) as Record<Locale, JsonValue>;

  // ── Key parity validation ─────────────────────────────────────────────────
  const [localeA, localeB] = LOCALES;
  const keysA = new Set(flattenKeys(results[localeA]));
  const keysB = new Set(flattenKeys(results[localeB]));
  const onlyA = [...keysA].filter((k) => !keysB.has(k));
  const onlyB = [...keysB].filter((k) => !keysA.has(k));

  if (onlyA.length > 0 || onlyB.length > 0) {
    console.error("✖  Key parity failure between locales:");
    onlyA.forEach((k) => console.error(`     only in ${localeA}: ${k}`));
    onlyB.forEach((k) => console.error(`     only in ${localeB}: ${k}`));
    process.exit(1);
  }

  // ── Write or check ────────────────────────────────────────────────────────
  let stale = false;
  for (const locale of LOCALES) {
    const outPath = path.join(MESSAGES_OUT_DIR, `${locale}.json`);
    const output = JSON.stringify(results[locale], null, 2) + "\n";

    if (check) {
      const existing = fs.existsSync(outPath)
        ? fs.readFileSync(outPath, "utf8")
        : "";
      if (existing !== output) {
        console.error(
          `✖  ${outPath} is out of date.\n   Run: npm run generate:messages`,
        );
        stale = true;
      }
    } else {
      fs.writeFileSync(outPath, output, "utf8");
      console.log(`  wrote  messages/${locale}.json`);
    }
  }

  if (check && stale) process.exit(1);

  console.log(
    check
      ? "✓ Generated message files are up to date."
      : `✓ Done. ${keysA.size} keys, parity OK.`,
  );
}

// ─── Entry ───────────────────────────────────────────────────────────────────

const isCheck = process.argv.includes("--check");
generate(isCheck);
