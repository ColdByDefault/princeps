import { afterEach, describe, expect, it } from "vitest";
import {
  decryptToken,
  encryptToken,
} from "@/lib/platform/integrations/shared/crypto";

const originalKey = process.env.INTEGRATION_TOKEN_ENCRYPTION_KEY;

function restoreKey() {
  if (originalKey === undefined) {
    delete process.env.INTEGRATION_TOKEN_ENCRYPTION_KEY;
  } else {
    process.env.INTEGRATION_TOKEN_ENCRYPTION_KEY = originalKey;
  }
}

describe("integration token crypto", () => {
  afterEach(() => {
    restoreKey();
  });

  it("returns plaintext unchanged when no encryption key is configured", () => {
    delete process.env.INTEGRATION_TOKEN_ENCRYPTION_KEY;

    expect(encryptToken("access-token")).toBe("access-token");
    expect(decryptToken("access-token")).toBe("access-token");
  });

  it("encrypts and decrypts tokens when a valid hex key is configured", () => {
    process.env.INTEGRATION_TOKEN_ENCRYPTION_KEY = "a".repeat(64);

    const encrypted = encryptToken("access-token");

    expect(encrypted).toMatch(
      /^enc:v1:[0-9a-f]+:[0-9a-f]+:[0-9a-f]+$/,
    );
    expect(encrypted).not.toBe("access-token");
    expect(decryptToken(encrypted)).toBe("access-token");
  });

  it("decrypts legacy plaintext tokens even when a key is configured", () => {
    process.env.INTEGRATION_TOKEN_ENCRYPTION_KEY = "a".repeat(64);

    expect(decryptToken("legacy-token")).toBe("legacy-token");
  });

  it("rejects malformed configured keys", () => {
    process.env.INTEGRATION_TOKEN_ENCRYPTION_KEY = "too-short";

    expect(() => encryptToken("access-token")).toThrow(
      /INTEGRATION_TOKEN_ENCRYPTION_KEY must be 32 bytes/,
    );
  });

  it("requires a key for encrypted tokens and validates token format", () => {
    process.env.INTEGRATION_TOKEN_ENCRYPTION_KEY = "a".repeat(64);
    const encrypted = encryptToken("access-token");

    delete process.env.INTEGRATION_TOKEN_ENCRYPTION_KEY;
    expect(() => decryptToken(encrypted)).toThrow(
      /required to decrypt stored integration tokens/,
    );

    process.env.INTEGRATION_TOKEN_ENCRYPTION_KEY = "a".repeat(64);
    expect(() => decryptToken("enc:v1:not-enough-parts")).toThrow(
      "Encrypted token has an unexpected format.",
    );
  });
});
