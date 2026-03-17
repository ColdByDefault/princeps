/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

export type MeetingStatus = "planned" | "completed" | "cancelled";
export type MeetingActionStatus = "open" | "done" | "cancelled";
export type MeetingDecisionStatus = "active" | "superseded" | "reversed";

export interface MeetingListItem {
  id: string;
  title: string;
  objective: string | null;
  scheduledAt: Date | string | null;
  status: MeetingStatus;
  updatedAt: Date | string;
  _count: {
    participants: number;
    actionItems: number;
    decisions: number;
  };
}

export interface MeetingParticipant {
  id: string;
  name: string;
  role: string | null;
  email: string | null;
  notes: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface MeetingActionItem {
  id: string;
  title: string;
  notes: string | null;
  assigneeName: string | null;
  dueAt: Date | string | null;
  status: MeetingActionStatus;
  completedAt: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface MeetingDecision {
  id: string;
  title: string;
  rationale: string | null;
  outcome: string | null;
  status: MeetingDecisionStatus;
  decidedAt: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface MeetingDetail {
  id: string;
  title: string;
  objective: string | null;
  scheduledAt: Date | string | null;
  durationMinutes: number | null;
  location: string | null;
  status: MeetingStatus;
  prepNotes: string | null;
  prepBrief: string | null;
  summary: string | null;
  nextSteps: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  participants: MeetingParticipant[];
  actionItems: MeetingActionItem[];
  decisions: MeetingDecision[];
}

export interface CreateMeetingPayload {
  title: string;
  objective?: string | null;
  scheduledAt?: string | null;
  durationMinutes?: number | null;
  location?: string | null;
  prepNotes?: string | null;
  participants?: Array<{
    name: string;
  }>;
}

export interface MeetingFormInitialValues {
  title: string;
  objective: string;
  scheduledAt: string;
  durationMinutes: string;
  location: string;
  prepNotes: string;
  participants: string;
}
