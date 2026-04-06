/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { useState } from "react";
import { toast } from "sonner";
import type { MeetingRecord } from "@/types/api";

type Translations = {
  createSuccess: string;
  createError: string;
  updateSuccess: string;
  updateError: string;
  deleteSuccess: string;
  deleteError: string;
};

export function useMeetingMutations(
  setMeetings: React.Dispatch<React.SetStateAction<MeetingRecord[]>>,
  t: Translations,
) {
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function createMeeting(input: {
    title: string;
    scheduledAt: string;
    durationMin?: number | null;
    location?: string | null;
    agenda?: string | null;
    summary?: string | null;
    labelIds?: string[];
    participantContactIds?: string[];
  }) {
    setCreating(true);
    try {
      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { meeting: MeetingRecord };
      setMeetings((prev) => [data.meeting, ...prev]);
      toast.success(t.createSuccess);
      return true;
    } catch {
      toast.error(t.createError);
      return false;
    } finally {
      setCreating(false);
    }
  }

  async function updateMeeting(
    meetingId: string,
    input: Partial<{
      title: string;
      scheduledAt: string;
      durationMin: number | null;
      location: string | null;
      status: string;
      agenda: string | null;
      summary: string | null;
      labelIds: string[];
      participantContactIds: string[];
    }>,
  ) {
    setUpdating(meetingId);
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
      toast.success(t.updateSuccess);
      return true;
    } catch {
      toast.error(t.updateError);
      return false;
    } finally {
      setUpdating(null);
    }
  }

  async function deleteMeeting(meetingId: string) {
    setDeleting(meetingId);
    try {
      const res = await fetch(`/api/meetings/${meetingId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      setMeetings((prev) => prev.filter((m) => m.id !== meetingId));
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
    createMeeting,
    updateMeeting,
    deleteMeeting,
  };
}
