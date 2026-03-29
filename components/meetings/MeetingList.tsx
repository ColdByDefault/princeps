/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import { useState } from "react";
import {
  CalendarPlus,
  Pencil,
  Trash2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from "lucide-react";
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

  // Prep state — keyed by meeting id
  const [prepOpen, setPrepOpen] = useState<Record<string, boolean>>({});
  const [prepLoading, setPrepLoading] = useState<Record<string, boolean>>({});
  const [prepPacks, setPrepPacks] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const m of meetings) {
      if (m.prepPack) map[m.id] = m.prepPack;
    }
    return map;
  });

  function togglePrep(id: string) {
    setPrepOpen((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  async function handleGeneratePrep(meeting: MeetingRecord) {
    setPrepLoading((prev) => ({ ...prev, [meeting.id]: true }));
    try {
      const res = await fetch(`/api/meetings/${meeting.id}/prep`, {
        method: "POST",
      });
      if (res.ok) {
        const data = (await res.json()) as { prepPack: string };
        setPrepPacks((prev) => ({ ...prev, [meeting.id]: data.prepPack }));
        setPrepOpen((prev) => ({ ...prev, [meeting.id]: true }));
        onMeetingsChange(
          meetings.map((m) =>
            m.id === meeting.id ? { ...m, prepPack: data.prepPack } : m,
          ),
        );
      } else {
        addNotice({
          type: "error",
          title: getMessage(
            messages,
            "meetings.prep.error",
            "Prep generation failed. Please try again.",
          ),
        });
      }
    } finally {
      setPrepLoading((prev) => ({ ...prev, [meeting.id]: false }));
    }
  }

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

  function renderList(items: MeetingRecord[], isUpcoming = false) {
    return (
      <ul className="divide-y rounded-lg border">
        {items.map((meeting) => {
          const hasPack = !!prepPacks[meeting.id];
          const isOpen = !!prepOpen[meeting.id];
          const isLoading = !!prepLoading[meeting.id];

          return (
            <li key={meeting.id} className="flex flex-col">
              <div className="flex items-start justify-between gap-4 px-4 py-3">
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
                    {isUpcoming && hasPack && (
                      <Badge
                        variant="outline"
                        className="shrink-0 text-xs gap-1"
                      >
                        <Sparkles className="size-2.5" />
                        {getMessage(
                          messages,
                          "meetings.prep.label",
                          "Meeting Prep",
                        )}
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {formatDateTime(meeting.scheduledAt)}
                    {meeting.durationMin != null &&
                      ` · ${meeting.durationMin} min`}
                    {meeting.location && ` · ${meeting.location}`}
                  </p>
                  {meeting.participants.length > 0 && (
                    <p className="text-muted-foreground text-xs">
                      {meeting.participants
                        .map((p) => p.contactName)
                        .join(", ")}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 gap-1 items-center">
                  {isUpcoming && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1.5 px-2 text-xs"
                        onClick={() =>
                          hasPack
                            ? togglePrep(meeting.id)
                            : void handleGeneratePrep(meeting)
                        }
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <RefreshCw className="size-3 animate-spin" />
                        ) : (
                          <Sparkles className="size-3" />
                        )}
                        {isLoading ? (
                          getMessage(
                            messages,
                            "meetings.prep.generating",
                            "Generating\u2026",
                          )
                        ) : hasPack ? (
                          isOpen ? (
                            <ChevronUp className="size-3" />
                          ) : (
                            <ChevronDown className="size-3" />
                          )
                        ) : (
                          getMessage(
                            messages,
                            "meetings.prep.generate",
                            "Generate prep",
                          )
                        )}
                      </Button>
                    </>
                  )}
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
              </div>

              {/* Prep pack panel */}
              {isUpcoming && isOpen && hasPack && (
                <div className="border-t bg-muted/30 px-4 py-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="size-3.5 text-primary" />
                      <span className="text-xs font-semibold tracking-[0.18em] uppercase text-muted-foreground">
                        {getMessage(
                          messages,
                          "meetings.prep.label",
                          "Meeting Prep",
                        )}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 gap-1.5 px-2 text-xs"
                      onClick={() => void handleGeneratePrep(meeting)}
                      disabled={isLoading}
                    >
                      <RefreshCw
                        className={`size-3 ${isLoading ? "animate-spin" : ""}`}
                      />
                      {getMessage(
                        messages,
                        "meetings.prep.regenerate",
                        "Regenerate",
                      )}
                    </Button>
                  </div>
                  <div className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap">
                    {prepPacks[meeting.id]}
                  </div>
                </div>
              )}
            </li>
          );
        })}
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
              {renderList(upcoming, true)}
            </div>
          )}
          {past.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
                {getMessage(messages, "meetings.sectionPast", "Past")}
              </h2>
              {renderList(past, false)}
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
