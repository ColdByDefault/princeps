/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * SPDX-License-Identifier: Elastic-2.0
 */

/**
 * Client-safe settings types and constants.
 * No server-only imports — safe to use in client components.
 */

export const ASSISTANT_TONES = [
  "professional",
  "friendly",
  "casual",
  "witty",
  "motivational",
  "concise",
] as const;
export type AssistantTone = (typeof ASSISTANT_TONES)[number];

export const ADDRESS_STYLES = [
  "firstname",
  "formal_male",
  "formal_female",
  "informal",
] as const;
export type AddressStyle = (typeof ADDRESS_STYLES)[number];

export const RESPONSE_LENGTHS = ["brief", "balanced", "detailed"] as const;
export type ResponseLength = (typeof RESPONSE_LENGTHS)[number];
