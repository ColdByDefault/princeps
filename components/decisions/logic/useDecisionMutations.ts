import { useState } from "react";
import { toast } from "sonner";
import type { DecisionRecord } from "@/types/api";

type Translations = {
  createSuccess: string;
  createError: string;
  updateSuccess: string;
  updateError: string;
  deleteSuccess: string;
  deleteError: string;
};

export function useDecisionMutations(
  setDecisions: React.Dispatch<React.SetStateAction<DecisionRecord[]>>,
  t: Translations,
) {
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function createDecision(input: {
    title: string;
    rationale?: string | null;
    outcome?: string | null;
    status?: string;
    decidedAt?: string | null;
    meetingId?: string | null;
    labelIds?: string[];
  }) {
    setCreating(true);
    try {
      const res = await fetch("/api/decisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { decision: DecisionRecord };
      setDecisions((prev) => [data.decision, ...prev]);
      toast.success(t.createSuccess);
      return true;
    } catch {
      toast.error(t.createError);
      return false;
    } finally {
      setCreating(false);
    }
  }

  async function updateDecision(
    decisionId: string,
    input: Partial<{
      title: string;
      rationale: string | null;
      outcome: string | null;
      status: string;
      decidedAt: string | null;
      meetingId: string | null;
      labelIds: string[];
    }>,
  ) {
    setUpdating(decisionId);
    try {
      const res = await fetch(`/api/decisions/${decisionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { decision: DecisionRecord };
      setDecisions((prev) =>
        prev.map((d) => (d.id === decisionId ? data.decision : d)),
      );
      toast.success(t.updateSuccess);
      return true;
    } catch {
      toast.error(t.updateError);
      return false;
    } finally {
      setUpdating(null);
    }
  }

  async function deleteDecision(decisionId: string) {
    setDeleting(decisionId);
    try {
      const res = await fetch(`/api/decisions/${decisionId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      setDecisions((prev) => prev.filter((d) => d.id !== decisionId));
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
    createDecision,
    updateDecision,
    deleteDecision,
  };
}
