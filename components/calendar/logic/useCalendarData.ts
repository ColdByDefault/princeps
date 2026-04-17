/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * SPDX-License-Identifier: Elastic-2.0
 */

"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import type {
  TaskRecord,
  MeetingRecord,
  LabelOptionRecord,
  ContactRecord,
} from "@/types/api";

type TaskMutationInput = {
  title: string;
  notes?: string;
  priority?: string;
  dueDate?: string | null;
  labelIds?: string[];
  goalIds?: string[];
};

type TaskUpdateInput = Partial<{
  title: string;
  notes: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  labelIds: string[];
  goalIds: string[];
}>;

type MeetingMutationInput = {
  title: string;
  scheduledAt: string;
  durationMin?: number | null;
  location?: string | null;
  agenda?: string | null;
  labelIds?: string[];
  participantContactIds?: string[];
  pushToGoogle?: boolean;
};

type MeetingUpdateInput = Partial<{
  title: string;
  scheduledAt: string;
  durationMin: number | null;
  location: string | null;
  status: string;
  kind: string;
  agenda: string | null;
  labelIds: string[];
  participantContactIds: string[];
  linkedTaskIds: string[];
  pushToGoogle: boolean;
}>;

type Translations = {
  createTaskSuccess: string;
  createTaskError: string;
  updateTaskSuccess: string;
  updateTaskError: string;
  deleteTaskSuccess: string;
  deleteTaskError: string;
  createMeetingSuccess: string;
  createMeetingError: string;
  updateMeetingSuccess: string;
  updateMeetingError: string;
  deleteMeetingSuccess: string;
  deleteMeetingError: string;
};

export function useCalendarData(t: Translations) {
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [meetings, setMeetings] = useState<MeetingRecord[]>([]);
  const [labels, setLabels] = useState<LabelOptionRecord[]>([]);
  const [goals, setGoals] = useState<{ id: string; title: string }[]>([]);
  const [contacts, setContacts] = useState<ContactRecord[]>([]);
  const [loading, setLoading] = useState(false);

  // Mutation loading states
  const [creatingTask, setCreatingTask] = useState(false);
  const [updatingTask, setUpdatingTask] = useState<string | null>(null);
  const [deletingTask, setDeletingTask] = useState<string | null>(null);
  const [creatingMeeting, setCreatingMeeting] = useState(false);
  const [updatingMeeting, setUpdatingMeeting] = useState<string | null>(null);
  const [deletingMeeting, setDeletingMeeting] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [tasksRes, meetingsRes, labelsRes, goalsRes, contactsRes] =
        await Promise.all([
          fetch("/api/tasks"),
          fetch("/api/meetings"),
          fetch("/api/labels"),
          fetch("/api/goals"),
          fetch("/api/contacts"),
        ]);

      if (tasksRes.ok) {
        const data = (await tasksRes.json()) as { tasks: TaskRecord[] };
        setTasks(data.tasks);
      }
      if (meetingsRes.ok) {
        const data = (await meetingsRes.json()) as {
          meetings: MeetingRecord[];
        };
        setMeetings(data.meetings);
      }
      if (labelsRes.ok) {
        const data = (await labelsRes.json()) as {
          labels: LabelOptionRecord[];
        };
        setLabels(data.labels);
      }
      if (goalsRes.ok) {
        const data = (await goalsRes.json()) as {
          goals: { id: string; title: string }[];
        };
        setGoals(data.goals.map((g) => ({ id: g.id, title: g.title })));
      }
      if (contactsRes.ok) {
        const data = (await contactsRes.json()) as {
          contacts: ContactRecord[];
        };
        setContacts(data.contacts);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // --- Task mutations ---

  async function createTask(input: TaskMutationInput): Promise<boolean> {
    setCreatingTask(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { task: TaskRecord };
      setTasks((prev) => [data.task, ...prev]);
      toast.success(t.createTaskSuccess);
      return true;
    } catch {
      toast.error(t.createTaskError);
      return false;
    } finally {
      setCreatingTask(false);
    }
  }

  async function updateTask(
    taskId: string,
    input: TaskUpdateInput,
  ): Promise<boolean> {
    setUpdatingTask(taskId);
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { task: TaskRecord };
      setTasks((prev) =>
        prev.map((task) => (task.id === taskId ? data.task : task)),
      );
      toast.success(t.updateTaskSuccess);
      return true;
    } catch {
      toast.error(t.updateTaskError);
      return false;
    } finally {
      setUpdatingTask(null);
    }
  }

  async function deleteTask(taskId: string): Promise<boolean> {
    setDeletingTask(taskId);
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      toast.success(t.deleteTaskSuccess);
      return true;
    } catch {
      toast.error(t.deleteTaskError);
      return false;
    } finally {
      setDeletingTask(null);
    }
  }

  // --- Meeting mutations ---

  async function createMeeting(input: MeetingMutationInput): Promise<boolean> {
    setCreatingMeeting(true);
    try {
      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { meeting: MeetingRecord };
      setMeetings((prev) => [data.meeting, ...prev]);
      toast.success(t.createMeetingSuccess);
      return true;
    } catch {
      toast.error(t.createMeetingError);
      return false;
    } finally {
      setCreatingMeeting(false);
    }
  }

  async function updateMeeting(
    meetingId: string,
    input: MeetingUpdateInput,
  ): Promise<boolean> {
    setUpdatingMeeting(meetingId);
    try {
      const res = await fetch(`/api/meetings/${meetingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { meeting: MeetingRecord };
      setMeetings((prev) =>
        prev.map((m) => (m.id === meetingId ? data.meeting : m)),
      );
      toast.success(t.updateMeetingSuccess);
      return true;
    } catch {
      toast.error(t.updateMeetingError);
      return false;
    } finally {
      setUpdatingMeeting(null);
    }
  }

  async function deleteMeeting(meetingId: string): Promise<boolean> {
    setDeletingMeeting(meetingId);
    try {
      const res = await fetch(`/api/meetings/${meetingId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      setMeetings((prev) => prev.filter((m) => m.id !== meetingId));
      toast.success(t.deleteMeetingSuccess);
      return true;
    } catch {
      toast.error(t.deleteMeetingError);
      return false;
    } finally {
      setDeletingMeeting(null);
    }
  }

  return {
    // data
    tasks,
    meetings,
    labels,
    goals,
    contacts,
    loading,
    fetchData,
    // task mutations
    creatingTask,
    updatingTask,
    deletingTask,
    createTask,
    updateTask,
    deleteTask,
    // meeting mutations
    creatingMeeting,
    updatingMeeting,
    deletingMeeting,
    createMeeting,
    updateMeeting,
    deleteMeeting,
  };
}
