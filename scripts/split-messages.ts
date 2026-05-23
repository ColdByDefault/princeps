/**
 * One-time script: splits monolithic messages/en.json and messages/de.json
 * into per-namespace source files under messages-src/{locale}/{namespace}.json.
 *
 * Run once, then delete this file. All future edits go in messages-src/.
 * Use generate-messages.ts to rebuild the monolithic output files.
 *
 * Usage:
 *   npx tsx scripts/split-messages.ts
 */

import fs from "fs";
import path from "path";

const LOCALES = ["en", "de"] as const;
const MESSAGES_DIR = path.join(process.cwd(), "messages");
const MESSAGES_SRC_DIR = path.join(process.cwd(), "messages-src");

for (const locale of LOCALES) {
  const srcFile = path.join(MESSAGES_DIR, `${locale}.json`);
  if (!fs.existsSync(srcFile)) {
    console.error(`✖  Not found: ${srcFile}`);
    process.exit(1);
  }

  const messages = JSON.parse(fs.readFileSync(srcFile, "utf8")) as Record<
    string,
    unknown
  >;

  const outDir = path.join(MESSAGES_SRC_DIR, locale);
  fs.mkdirSync(outDir, { recursive: true });

  for (const [namespace, value] of Object.entries(messages)) {
    const outFile = path.join(outDir, `${namespace}.json`);
    fs.writeFileSync(outFile, JSON.stringify(value, null, 2) + "\n", "utf8");
    console.log(`  wrote  messages-src/${locale}/${namespace}.json`);
  }
}

console.log(
  "\n✓ Split complete. Review messages-src/, then run: npm run generate:messages",
);
