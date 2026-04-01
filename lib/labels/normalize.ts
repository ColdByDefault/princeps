/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

export function sanitizeLabelName(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function normalizeLabelName(value: string): string {
  return sanitizeLabelName(value).toLocaleLowerCase();
}
