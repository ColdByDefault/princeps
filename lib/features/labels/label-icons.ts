/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version beta
 * @since beta
 * @module
 * @description
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
