/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getMessage } from "@/lib/i18n";
import { type MessageDictionary } from "@/types/i18n";

export default function MeetingListItemActions({
  meetingId,
  messages,
}: {
  meetingId: string;
  messages: MessageDictionary;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(
      getMessage(
        messages,
        "meetings.form.deleteConfirm",
        "Delete this meeting? This cannot be undone.",
      ),
    );

    if (!confirmed) {
      return;
    }

    setDeleting(true);

    try {
      const response = await fetch(`/api/meetings/${meetingId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        setDeleting(false);
        return;
      }

      router.refresh();
    } catch {
      setDeleting(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        size="icon-sm"
        variant="outline"
        className="cursor-pointer"
        aria-label={getMessage(messages, "meetings.nav.edit", "Edit meeting")}
        title={getMessage(messages, "meetings.nav.edit", "Edit meeting")}
        nativeButton={false}
        render={<Link href={`/meetings/${meetingId}/edit`} />}
      >
        <Pencil className="size-4" />
      </Button>
      <Button
        type="button"
        size="icon-sm"
        variant="destructive"
        className="cursor-pointer"
        aria-label={getMessage(
          messages,
          "meetings.nav.delete",
          "Delete meeting",
        )}
        title={getMessage(messages, "meetings.nav.delete", "Delete meeting")}
        disabled={deleting}
        onClick={handleDelete}
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}
