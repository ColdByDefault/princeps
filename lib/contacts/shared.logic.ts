/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * SPDX-License-Identifier: Elastic-2.0
 */

import "server-only";

import type { ContactRecord } from "@/types/api";

export const CONTACT_SELECT = {
  id: true,
  name: true,
  role: true,
  company: true,
  email: true,
  phone: true,
  notes: true,
  lastContact: true,
  createdAt: true,
  updatedAt: true,
  labelLinks: {
    select: {
      label: { select: { id: true, name: true, color: true, icon: true } },
    },
  },
} as const;

type ContactRow = {
  id: string;
  name: string;
  role: string | null;
  company: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  lastContact: Date | null;
  createdAt: Date;
  updatedAt: Date;
  labelLinks: { label: { id: string; name: string; color: string } }[];
};

export function toContactRecord(row: ContactRow): ContactRecord {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    company: row.company,
    email: row.email,
    phone: row.phone,
    notes: row.notes,
    labels: row.labelLinks.map((l) => l.label),
    lastContact: row.lastContact?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
