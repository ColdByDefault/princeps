import { useState } from "react";
import { toast } from "sonner";
import type { MemoryEntryRecord } from "@/types/api";

type Translations = {
  createSuccess: string;
  createError: string;
  updateSuccess: string;
  updateError: string;
  deleteSuccess: string;
  deleteError: string;
};

export function useMemoryMutations(
  setEntries: React.Dispatch<React.SetStateAction<MemoryEntryRecord[]>>,
  t: Translations,
) {
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function createEntry(input: { key: string; value: string }) {
    setCreating(true);
    try {
      const res = await fetch("/api/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { entry: MemoryEntryRecord };
      setEntries((prev) => [data.entry, ...prev]);
      toast.success(t.createSuccess);
      return true;
    } catch {
      toast.error(t.createError);
      return false;
    } finally {
      setCreating(false);
    }
  }

  async function updateEntry(
    id: string,
    input: { key?: string; value?: string },
  ) {
    setUpdating(id);
    try {
      const res = await fetch(`/api/memory/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { entry: MemoryEntryRecord };
      setEntries((prev) => prev.map((e) => (e.id === id ? data.entry : e)));
      toast.success(t.updateSuccess);
      return true;
    } catch {
      toast.error(t.updateError);
      return false;
    } finally {
      setUpdating(null);
    }
  }

  async function deleteEntry(id: string) {
    setDeleting(id);
    try {
      const res = await fetch(`/api/memory/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setEntries((prev) => prev.filter((e) => e.id !== id));
      toast.success(t.deleteSuccess);
    } catch {
      toast.error(t.deleteError);
    } finally {
      setDeleting(null);
    }
  }

  return {
    creating,
    updating,
    deleting,
    createEntry,
    updateEntry,
    deleteEntry,
  };
}
