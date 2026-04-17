/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * SPDX-License-Identifier: Elastic-2.0
 */

import "server-only";
import type { GoalRecord, MilestoneRecord } from "@/types/api";

export const GOAL_SELECT = {
  id: true,
  title: true,
  description: true,
  status: true,
  targetDate: true,
  createdAt: true,
  updatedAt: true,
  milestones: {
    select: {
      id: true,
      title: true,
      completed: true,
      position: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: [{ position: "asc" as const }, { createdAt: "asc" as const }],
  },
  taskLinks: {
    select: {
      task: { select: { id: true, title: true, status: true } },
    },
  },
  labelLinks: {
    select: {
      label: { select: { id: true, name: true, color: true, icon: true } },
    },
  },
};

type GoalRow = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  targetDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  milestones: {
    id: string;
    title: string;
    completed: boolean;
    position: number;
    createdAt: Date;
    updatedAt: Date;
  }[];
  taskLinks: { task: { id: string; title: string; status: string } }[];
  labelLinks: {
    label: { id: string; name: string; color: string; icon?: string | null };
  }[];
};

function toMilestoneRecord(m: GoalRow["milestones"][number]): MilestoneRecord {
  return {
    id: m.id,
    title: m.title,
    completed: m.completed,
    position: m.position,
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString(),
  };
}

export function toGoalRecord(row: GoalRow): GoalRecord {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    targetDate: row.targetDate?.toISOString() ?? null,
    milestones: row.milestones.map(toMilestoneRecord),
    tasks: row.taskLinks.map((t) => t.task),
    labels: row.labelLinks.map((l) => l.label),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
