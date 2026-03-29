/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import { useState } from "react";
import { CalendarPlus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog, useNotice } from "@/components/shared";
import { getMessage } from "@/lib/i18n";
import { MeetingForm } from "./MeetingForm";
import type { ContactRecord, MeetingRecord } from "@/types/api";
import type { MessageDictionary } from "@/types/i18n";

interface MeetingListProps {
  messages: MessageDictionary;
  meetings: MeetingRecord[];
  contacts: ContactRecord[];
  onMeetingsChange: (meetings: MeetingRecord[]) => void;
}

function statusVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  if (status === "upcoming") return "default";
  if (status === "done") return "secondary";
  return "outline";
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function MeetingList({
  messages,
  meetings,
  contacts,
  onMeetingsChange,
}: MeetingListProps) {
  const { addNotice } = useNotice();
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<MeetingRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  function openCreate() {
    setEditTarget(null);
    setFormOpen(true);
  }

  function openEdit(meeting: MeetingRecord) {
    setEditTarget(meeting);
    setFormOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const res = await fetch(`/api/meetings/${deleteTarget}`, {
      method: "DELETE",
    });
    if (res.ok) {
      onMeetingsChange(meetings.filter((m) => m.id !== deleteTarget));
      addNotice({
        type: "success",
        title: getMessage(
          messages,
          "meetings.deleteSuccess",
          "Meeting deleted.",
        ),
      });
    } else {
      addNotice({
        type: "error",
        title: getMessage(
          messages,
          "meetings.deleteError",
          "Could not delete meeting.",
        ),
      });
    }
    setDeleteTarget(null);
  }

  const upcoming = meetings.filter((m) => m.status === "upcoming");
  const past = meetings.filter((m) => m.status !== "upcoming");

  function renderList(items: MeetingRecord[]) {
    return (
      <ul className="divide-y rounded-lg border">
        {items.map((meeting) => (
          <li
            key={meeting.id}
            className="flex items-start justify-between gap-4 px-4 py-3"
          >
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm truncate">
                  {meeting.title}
                </span>
                <Badge
                  variant={statusVariant(meeting.status)}
                  className="shrink-0 text-xs"
                >
                  {getMessage(
                    messages,
                    `meetings.status.${meeting.status}` as Parameters<
                      typeof getMessage
                    >[1],
                    meeting.status,
                  )}
                </Badge>
              </div>
              <p className="text-muted-foreground text-xs">
                {formatDateTime(meeting.scheduledAt)}
                {meeting.durationMin != null && ` · ${meeting.durationMin} min`}
                {meeting.location && ` · ${meeting.location}`}
              </p>
              {meeting.participants.length > 0 && (
                <p className="text-muted-foreground text-xs">
                  {meeting.participants.map((p) => p.contactName).join(", ")}
                </p>
              )}
            </div>
            <div className="flex shrink-0 gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => openEdit(meeting)}
              >
                <Pencil className="h-3.5 w-3.5" />
                <span className="sr-only">Edit</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={() => setDeleteTarget(meeting.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="sr-only">Delete</span>
              </Button>
            </div>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-sm">
          {meetings.length} {meetings.length === 1 ? "meeting" : "meetings"}
        </span>
        <Button size="sm" onClick={openCreate}>
          <CalendarPlus className="mr-2 h-4 w-4" />
          {getMessage(messages, "meetings.add", "Add meeting")}
        </Button>
      </div>

      {meetings.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm font-medium">
            {getMessage(messages, "meetings.empty", "No meetings yet.")}
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            {getMessage(
              messages,
              "meetings.emptyBody",
              "Add meetings to track upcoming events and past outcomes.",
            )}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {upcoming.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
                {getMessage(messages, "meetings.sectionUpcoming", "Upcoming")}
              </h2>
              {renderList(upcoming)}
            </div>
          )}
          {past.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
                {getMessage(messages, "meetings.sectionPast", "Past")}
              </h2>
              {renderList(past)}
            </div>
          )}
        </div>
      )}

      <MeetingForm
        messages={messages}
        open={formOpen}
        initial={editTarget}
        contacts={contacts}
        onClose={() => setFormOpen(false)}
        onSaved={(meeting) => {
          onMeetingsChange(
            editTarget
              ? meetings.map((m) => (m.id === meeting.id ? meeting : m))
              : [meeting, ...meetings],
          );
          setFormOpen(false);
          addNotice({
            type: "success",
            title: getMessage(
              messages,
              editTarget ? "meetings.updateSuccess" : "meetings.createSuccess",
              editTarget ? "Meeting updated." : "Meeting added.",
            ),
          });
        }}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(o) => {
          if (!o) setDeleteTarget(null);
        }}
        title={getMessage(
          messages,
          "meetings.deleteTitle",
          "Delete this meeting?",
        )}
        description={getMessage(
          messages,
          "meetings.deleteDescription",
          "This will permanently remove the meeting record.",
        )}
        confirmLabel={getMessage(messages, "meetings.deleteConfirm", "Delete")}
        cancelLabel={getMessage(messages, "meetings.cancel", "Cancel")}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}
