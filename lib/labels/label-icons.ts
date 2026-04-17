/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * SPDX-License-Identifier: Elastic-2.0
 */

/**
 * The 20 Lucide icon names available for label decoration.
 * Client-safe — no server-only imports.
 */
export const LABEL_ICON_NAMES = [
  "Tag",
  "Bookmark",
  "Star",
  "Heart",
  "Flag",
  "Zap",
  "Flame",
  "Circle",
  "Diamond",
  "Shield",
  "Crown",
  "Trophy",
  "Gem",
  "Briefcase",
  "Lightbulb",
  "Globe",
  "Clock",
  "Bell",
  "Target",
  "Rocket",
] as const;

export type LabelIconName = (typeof LABEL_ICON_NAMES)[number];
