import type { GoalRecord, MilestoneRecord } from "@/types/api";
import { useState } from "react";
import { toast } from "sonner";

type GoalTranslations = {
  createSuccess: string;
  createError: string;
  updateSuccess: string;
  updateError: string;
  deleteSuccess: string;
  deleteError: string;
};

type CreateGoalInput = {
  title: string;
  description?: string | null;
  status?: string;
  targetDate?: string | null;
  labelIds?: string[];
  taskIds?: string[];
  milestones?: { title: string; completed?: boolean; position?: number }[];
};

type UpdateGoalInput = Partial<CreateGoalInput>;

export function useGoalMutations(
  setGoals: React.Dispatch<React.SetStateAction<GoalRecord[]>>,
  t: GoalTranslations,
) {
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [milestonePending, setMilestonePending] = useState<string | null>(null);

  async function createGoal(input: CreateGoalInput) {
    setCreating(true);
    try {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { goal: GoalRecord };
      setGoals((prev) => [data.goal, ...prev]);
      toast.success(t.createSuccess);
      return true;
    } catch {
      toast.error(t.createError);
      return false;
    } finally {
      setCreating(false);
    }
  }

  async function updateGoal(goalId: string, input: UpdateGoalInput) {
    setUpdating(goalId);
    try {
      const res = await fetch(`/api/goals/${goalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { goal: GoalRecord };
      setGoals((prev) => prev.map((g) => (g.id === goalId ? data.goal : g)));
      toast.success(t.updateSuccess);
      return true;
    } catch {
      toast.error(t.updateError);
      return false;
    } finally {
      setUpdating(null);
    }
  }

  async function deleteGoal(goalId: string) {
    setDeleting(goalId);
    try {
      const res = await fetch(`/api/goals/${goalId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setGoals((prev) => prev.filter((g) => g.id !== goalId));
      toast.success(t.deleteSuccess);
      return true;
    } catch {
      toast.error(t.deleteError);
      return false;
    } finally {
      setDeleting(null);
    }
  }

  async function addMilestone(goalId: string, title: string) {
    setMilestonePending(goalId);
    try {
      const res = await fetch(`/api/goals/${goalId}/milestones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { milestone: MilestoneRecord };
      setGoals((prev) =>
        prev.map((g) =>
          g.id === goalId
            ? { ...g, milestones: [...g.milestones, data.milestone] }
            : g,
        ),
      );
      return true;
    } catch {
      return false;
    } finally {
      setMilestonePending(null);
    }
  }

  async function toggleMilestone(
    goalId: string,
    milestoneId: string,
    completed: boolean,
  ) {
    setMilestonePending(milestoneId);
    try {
      const res = await fetch(
        `/api/goals/${goalId}/milestones/${milestoneId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ completed }),
        },
      );
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { milestone: MilestoneRecord };
      setGoals((prev) =>
        prev.map((g) =>
          g.id === goalId
            ? {
                ...g,
                milestones: g.milestones.map((m) =>
                  m.id === milestoneId ? data.milestone : m,
                ),
              }
            : g,
        ),
      );
      return true;
    } catch {
      return false;
    } finally {
      setMilestonePending(null);
    }
  }

  async function deleteMilestone(goalId: string, milestoneId: string) {
    setMilestonePending(milestoneId);
    try {
      const res = await fetch(
        `/api/goals/${goalId}/milestones/${milestoneId}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error();
      setGoals((prev) =>
        prev.map((g) =>
          g.id === goalId
            ? {
                ...g,
                milestones: g.milestones.filter((m) => m.id !== milestoneId),
              }
            : g,
        ),
      );
      return true;
    } catch {
      return false;
    } finally {
      setMilestonePending(null);
    }
  }

  return {
    creating,
    updating,
    deleting,
    milestonePending,
    createGoal,
    updateGoal,
    deleteGoal,
    addMilestone,
    toggleMilestone,
    deleteMilestone,
  };
}
