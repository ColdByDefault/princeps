/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.8
 * @since canary-v1.1.8
 */

import "server-only";

import { listContacts } from "@/lib/features/contacts";
import { listDecisions } from "@/lib/features/decisions";
import { listGoals } from "@/lib/features/goals";
import { listLabels } from "@/lib/features/labels";
import { listMeetings } from "@/lib/features/meetings";
import { listReports } from "@/lib/features/reports";
import { listTasks } from "@/lib/features/tasks";

const ENTITY_LIMIT = 50;
const REPORT_LIMIT = 30;

type SearchLabelItem = {
  id: string;
  name: string;
  color: string;
  icon?: string | null;
};

type SearchTaskItem = {
  id: string;
  title: string;
  labels: SearchLabelItem[];
};

type SearchContactItem = {
  id: string;
  name: string;
  company: string | null;
  labels: SearchLabelItem[];
};

type SearchMeetingItem = {
  id: string;
  title: string;
  labels: SearchLabelItem[];
};

type SearchDecisionItem = {
  id: string;
  title: string;
  labels: SearchLabelItem[];
};

type SearchGoalItem = {
  id: string;
  title: string;
  labels: SearchLabelItem[];
};

type SearchReportItem = {
  id: string;
  createdAt: string;
  toolsCalled: string[];
  detailTools: string[];
};

export interface GlobalSearchData {
  tasks: SearchTaskItem[];
  contacts: SearchContactItem[];
  meetings: SearchMeetingItem[];
  decisions: SearchDecisionItem[];
  goals: SearchGoalItem[];
  labels: SearchLabelItem[];
  reports: SearchReportItem[];
}

function mapLabels(
  labels: Array<{
    id: string;
    name: string;
    color: string;
    icon?: string | null;
  }>,
): SearchLabelItem[] {
  return labels.map(({ id, name, color, icon }) => ({
    id,
    name,
    color,
    icon: icon ?? null,
  }));
}

function uniqueTools(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

export async function listGlobalSearchData(
  userId: string,
): Promise<GlobalSearchData> {
  const [tasks, contacts, meetings, decisions, goals, labels, reports] =
    await Promise.all([
      listTasks(userId),
      listContacts(userId),
      listMeetings(userId),
      listDecisions(userId),
      listGoals(userId),
      listLabels(userId),
      listReports(userId),
    ]);

  return {
    tasks: tasks.slice(0, ENTITY_LIMIT).map((task) => ({
      id: task.id,
      title: task.title,
      labels: mapLabels(task.labels),
    })),
    contacts: contacts.slice(0, ENTITY_LIMIT).map((contact) => ({
      id: contact.id,
      name: contact.name,
      company: contact.company,
      labels: mapLabels(contact.labels),
    })),
    meetings: meetings.slice(0, ENTITY_LIMIT).map((meeting) => ({
      id: meeting.id,
      title: meeting.title,
      labels: mapLabels(meeting.labels),
    })),
    decisions: decisions.slice(0, ENTITY_LIMIT).map((decision) => ({
      id: decision.id,
      title: decision.title,
      labels: mapLabels(decision.labels),
    })),
    goals: goals.slice(0, ENTITY_LIMIT).map((goal) => ({
      id: goal.id,
      title: goal.title,
      labels: mapLabels(goal.labels),
    })),
    labels: labels.slice(0, ENTITY_LIMIT).map((label) => ({
      id: label.id,
      name: label.name,
      color: label.color,
      icon: label.icon ?? null,
    })),
    reports: reports.slice(0, REPORT_LIMIT).map((report) => ({
      id: report.id,
      createdAt: report.createdAt,
      toolsCalled: uniqueTools(report.toolsCalled),
      detailTools: uniqueTools(report.details.map((detail) => detail.tool)),
    })),
  };
}
