/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.4
 * @since canary-v1.1.4
 */

import "server-only";

import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const ENC_PREFIX = "enc:v1:";

/**
 * Reads and validates INTEGRATION_TOKEN_ENCRYPTION_KEY from the environment.
 * Returns null when the key is absent — callers fall back to plaintext mode
 * (acceptable for local development without the key set).
 * Throws if the key is present but malformed.
 */
function getKey(): Buffer | null {
  const raw = process.env.INTEGRATION_TOKEN_ENCRYPTION_KEY;
  if (!raw) return null;

  // Accept 64 hex chars (32 bytes) or 44 base64 chars (32 bytes with padding)
  const buf = Buffer.from(raw, raw.length === 64 ? "hex" : "base64");
  if (buf.length !== 32) {
    throw new Error(
      "INTEGRATION_TOKEN_ENCRYPTION_KEY must be 32 bytes " +
        "(64 lowercase hex characters or 44 base64 characters).",
    );
  }
  return buf;
}

/**
 * Encrypts a plaintext token using AES-256-GCM.
 *
 * Returns a string with the format `enc:v1:<iv>:<authTag>:<ciphertext>` (all hex).
 *
 * If INTEGRATION_TOKEN_ENCRYPTION_KEY is not set, the value is returned as-is
 * so that local development works without configuration changes.
 */
export function encryptToken(plaintext: string): string {
  const key = getKey();
  if (!key) return plaintext;

  const iv = randomBytes(12); // 96-bit IV recommended for GCM
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return (
    ENC_PREFIX +
    iv.toString("hex") +
    ":" +
    authTag.toString("hex") +
    ":" +
    encrypted.toString("hex")
  );
}

/**
 * Decrypts a token that was encrypted by `encryptToken`.
 *
 * If the value does not start with `enc:v1:` it is returned as-is, which
 * preserves backward compatibility with any plaintext tokens written before
 * the encryption key was configured.
 *
 * Throws when the value is encrypted but the key is missing or wrong.
 */
export function decryptToken(value: string): string {
  if (!value.startsWith(ENC_PREFIX)) {
    // Plaintext — either key was never set or token pre-dates encryption.
    return value;
  }

  const key = getKey();
  if (!key) {
    throw new Error(
      "INTEGRATION_TOKEN_ENCRYPTION_KEY is required to decrypt stored integration tokens. " +
        "Set it in your environment or regenerate tokens after adding the key.",
    );
  }

  const rest = value.slice(ENC_PREFIX.length);
  const parts = rest.split(":");
  if (parts.length !== 3) {
    throw new Error("Encrypted token has an unexpected format.");
  }

  const [ivHex, authTagHex, ciphertextHex] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const ciphertext = Buffer.from(ciphertextHex, "hex");

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}
