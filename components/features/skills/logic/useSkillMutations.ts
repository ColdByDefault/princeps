/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.10
 * @since canary-v1.1.10
 */

import { useState } from "react";
import { toast } from "sonner";
import type { SkillRecord } from "@/types/api";

export type SkillMutationInput = {
  name: string;
  description: string;
  instructionsMarkdown: string;
  allowedTools: string[];
};

type Translations = {
  createSuccess: string;
  createError: string;
  updateSuccess: string;
  updateError: string;
  deleteSuccess: string;
  deleteError: string;
  invalidToolsError: string;
  limitReached: string;
  notFound: string;
};

export function useSkillMutations(
  setSkills: React.Dispatch<React.SetStateAction<SkillRecord[]>>,
  t: Translations,
) {
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function createSkill(input: SkillMutationInput) {
    setCreating(true);

    try {
      const res = await fetch("/api/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      if (!res.ok) {
        if (res.status === 403) {
          toast.error(t.limitReached);
        } else if (res.status === 400) {
          toast.error(t.invalidToolsError);
        } else {
          toast.error(t.createError);
        }
        return false;
      }

      const data = (await res.json()) as { skill: SkillRecord };
      setSkills((prev) => [data.skill, ...prev]);
      toast.success(t.createSuccess);
      return true;
    } catch {
      toast.error(t.createError);
      return false;
    } finally {
      setCreating(false);
    }
  }

  async function updateSkill(skillId: string, input: SkillMutationInput) {
    setUpdating(skillId);

    try {
      const res = await fetch(`/api/skills/${skillId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      if (!res.ok) {
        if (res.status === 404) {
          toast.error(t.notFound);
        } else if (res.status === 400) {
          toast.error(t.invalidToolsError);
        } else {
          toast.error(t.updateError);
        }
        return false;
      }

      const data = (await res.json()) as { skill: SkillRecord };
      setSkills((prev) => prev.map((s) => (s.id === skillId ? data.skill : s)));
      toast.success(t.updateSuccess);
      return true;
    } catch {
      toast.error(t.updateError);
      return false;
    } finally {
      setUpdating(null);
    }
  }

  async function deleteSkill(skillId: string) {
    setDeleting(skillId);

    try {
      const res = await fetch(`/api/skills/${skillId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        if (res.status === 404) {
          toast.error(t.notFound);
        } else {
          toast.error(t.deleteError);
        }
        return false;
      }

      setSkills((prev) => prev.filter((s) => s.id !== skillId));
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
    createSkill,
    updateSkill,
    deleteSkill,
  };
}
