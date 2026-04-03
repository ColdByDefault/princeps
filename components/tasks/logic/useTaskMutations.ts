/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { useState } from "react";
import { toast } from "sonner";
import type { TaskRecord } from "@/types/api";

type Translations = {
  createSuccess: string;
  createError: string;
  updateSuccess: string;
  updateError: string;
  deleteSuccess: string;
  deleteError: string;
  completeSuccess: string;
  reopenSuccess: string;
  completeError: string;
};

export function useTaskMutations(
  setTasks: React.Dispatch<React.SetStateAction<TaskRecord[]>>,
  t: Translations,
) {
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function createTask(input: {
    title: string;
    notes?: string;
    priority?: string;
    dueDate?: string | null;
    labelIds?: string[];
  }) {
    setCreating(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { task: TaskRecord };
      setTasks((prev) => [data.task, ...prev]);
      toast.success(t.createSuccess);
      return true;
    } catch {
      toast.error(t.createError);
      return false;
    } finally {
      setCreating(false);
    }
  }

  async function updateTask(
    taskId: string,
    input: Partial<{
      title: string;
      notes: string | null;
      status: string;
      priority: string;
      dueDate: string | null;
      labelIds: string[];
    }>,
    silent = false,
  ) {
    setUpdating(taskId);
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { task: TaskRecord };
      setTasks((prev) => prev.map((t) => (t.id === taskId ? data.task : t)));
      if (!silent) toast.success(t.updateSuccess);
      return true;
    } catch {
      toast.error(t.updateError);
      return false;
    } finally {
      setUpdating(null);
    }
  }

  async function toggleDone(task: TaskRecord) {
    const newStatus = task.status === "done" ? "open" : "done";
    const ok = await updateTask(task.id, { status: newStatus }, true);
    if (ok) {
      toast.success(newStatus === "done" ? t.completeSuccess : t.reopenSuccess);
    }
  }

  async function deleteTask(taskId: string) {
    setDeleting(taskId);
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      toast.success(t.deleteSuccess);
      return true;
    } catch {
      toast.error(t.deleteError);
      return false;
    } finally {
      setDeleting(null);
    }
  }

  return {
    creating,
    updating,
    deleting,
    createTask,
    updateTask,
    toggleDone,
    deleteTask,
  };
}
