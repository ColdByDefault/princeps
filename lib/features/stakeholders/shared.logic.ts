/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.4
 * @since canary-v1.1.4
 */

import "server-only";
import type { StakeholderRecord } from "@/types/api";

export const STAKEHOLDER_SELECT = {
  id: true,
  goalId: true,
  contactId: true,
  role: true,
  health: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  contact: { select: { name: true } },
};

type StakeholderRow = {
  id: string;
  goalId: string | null;
  contactId: string;
  role: string | null;
  health: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  contact: { name: string };
};

export function toStakeholderRecord(row: StakeholderRow): StakeholderRecord {
  return {
    id: row.id,
    goalId: row.goalId,
    contactId: row.contactId,
    contactName: row.contact.name,
    role: row.role,
    health: row.health,
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
