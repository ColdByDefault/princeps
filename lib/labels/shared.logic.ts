/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import type { LabelRecord } from "@/types/api";

export const LABEL_SELECT = {
  id: true,
  name: true,
  color: true,
  icon: true,
  createdAt: true,
  updatedAt: true,
} as const;

type LabelRow = {
  id: string;
  name: string;
  color: string;
  icon: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export function toLabelRecord(row: LabelRow): LabelRecord {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    icon: row.icon,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
