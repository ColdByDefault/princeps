/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.2.1
 * @since canary-v1.1.8
 */

import { useState } from "react";
import { toast } from "sonner";
import type { ReadingItemRecord } from "@/types/api";

type MutationMessages = {
  addSuccess: string;
  addError: string;
  markReadSuccess: string;
  markReadError: string;
  markUnreadSuccess: string;
  markUnreadError: string;
  archiveSuccess: string;
  archiveError: string;
  unarchiveSuccess: string;
  unarchiveError: string;
  deleteSuccess: string;
  deleteError: string;
};

export function useReadingQueueMutations(
  setItems: React.Dispatch<React.SetStateAction<ReadingItemRecord[]>>,
  messages: MutationMessages,
) {
  const [adding, setAdding] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function addItem(url: string, title?: string) {
    setAdding(true);
    try {
      const res = await fetch("/api/reading-queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, ...(title ? { title } : {}) }),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { item: ReadingItemRecord };
      setItems((prev) => [data.item, ...prev]);
      toast.success(messages.addSuccess);
      return true;
    } catch {
      toast.error(messages.addError);
      return false;
    } finally {
      setAdding(false);
    }
  }

  async function markRead(id: string) {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/reading-queue/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "read" }),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { item: ReadingItemRecord };
      setItems((prev) => prev.map((i) => (i.id === id ? data.item : i)));
      toast.success(messages.markReadSuccess);
      return true;
    } catch {
      toast.error(messages.markReadError);
      return false;
    } finally {
      setUpdatingId(null);
    }
  }

  async function archive(id: string) {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/reading-queue/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "archived" }),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { item: ReadingItemRecord };
      setItems((prev) => prev.map((i) => (i.id === id ? data.item : i)));
      toast.success(messages.archiveSuccess);
      return true;
    } catch {
      toast.error(messages.archiveError);
      return false;
    } finally {
      setUpdatingId(null);
    }
  }

  async function markUnread(id: string) {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/reading-queue/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "unread" }),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { item: ReadingItemRecord };
      setItems((prev) => prev.map((i) => (i.id === id ? data.item : i)));
      toast.success(messages.markUnreadSuccess);
      return true;
    } catch {
      toast.error(messages.markUnreadError);
      return false;
    } finally {
      setUpdatingId(null);
    }
  }

  async function unarchive(id: string) {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/reading-queue/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "unread" }),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { item: ReadingItemRecord };
      setItems((prev) => prev.map((i) => (i.id === id ? data.item : i)));
      toast.success(messages.unarchiveSuccess);
      return true;
    } catch {
      toast.error(messages.unarchiveError);
      return false;
    } finally {
      setUpdatingId(null);
    }
  }

  async function deleteItem(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/reading-queue/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast.success(messages.deleteSuccess);
      return true;
    } catch {
      toast.error(messages.deleteError);
      return false;
    } finally {
      setDeletingId(null);
    }
  }

  return {
    adding,
    updatingId,
    deletingId,
    addItem,
    markRead,
    markUnread,
    archive,
    unarchive,
    deleteItem,
  };
}
