/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

/** Keys that can be included in a public share card. */
export const SHAREABLE_FIELD_KEYS = [
  "name",
  "email",
  "jobTitle",
  "company",
  "location",
  "bio",
  "phone",
] as const;

export type ShareableFieldKey = (typeof SHAREABLE_FIELD_KEYS)[number];

/** Resolved payload sent to the public share page. */
export interface ShareCardData {
  fields: Record<string, string>;
}
