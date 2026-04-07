/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import type { TaskRecord } from "@/types/api";

export const TASK_SELECT = {
  id: true,
  title: true,
  notes: true,
  status: true,
  priority: true,
  dueDate: true,
  meetingId: true,
  createdAt: true,
  updatedAt: true,
  goalLinks: {
    select: {
      goal: { select: { id: true, title: true } },
    },
  },
  labelLinks: {
    select: {
      label: { select: { id: true, name: true, color: true, icon: true } },
    },
  },
} as const;

type TaskRow = {
  id: string;
  title: string;
  notes: string | null;
  status: string;
  priority: string;
  dueDate: Date | null;
  meetingId: string | null;
  createdAt: Date;
  updatedAt: Date;
  goalLinks: { goal: { id: string; title: string } }[];
  labelLinks: { label: { id: string; name: string; color: string } }[];
};

export function toTaskRecord(row: TaskRow): TaskRecord {
  return {
    id: row.id,
    title: row.title,
    notes: row.notes,
    status: row.status,
    priority: row.priority,
    dueDate: row.dueDate?.toISOString() ?? null,
    meetingId: row.meetingId,
    goals: row.goalLinks.map((g) => g.goal),
    labels: row.labelLinks.map((l) => l.label),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
