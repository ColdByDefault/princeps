/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MeetingCard } from "./MeetingCard";
import { CreateMeetingDialog } from "./CreateMeetingDialog";
import { EditMeetingDialog } from "./EditMeetingDialog";
import { SummaryDialog } from "./SummaryDialog";
import { useMeetingMutations } from "./logic/useMeetingMutations";
import type {
  LabelOptionRecord,
  MeetingRecord,
  ContactRecord,
} from "@/types/api";

type Filter = "all" | "upcoming" | "done" | "cancelled";

type MeetingsShellProps = {
  initialMeetings: MeetingRecord[];
  availableLabels: LabelOptionRecord[];
  availableContacts: ContactRecord[];
};

export function MeetingsShell({
  initialMeetings,
  availableLabels,
  availableContacts,
}: MeetingsShellProps) {
  const t = useTranslations("meetings");
  const [meetings, setMeetings] = useState<MeetingRecord[]>(initialMeetings);
  const [filter, setFilter] = useState<Filter>("all");
  const [editMeeting, setEditMeeting] = useState<MeetingRecord | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [summaryMeeting, setSummaryMeeting] = useState<MeetingRecord | null>(
    null,
  );
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const {
    creating,
    updating,
    deleting,
    createMeeting,
    updateMeeting,
    deleteMeeting,
  } = useMeetingMutations(setMeetings, {
    createSuccess: t("createDialog.success"),
    createError: t("createDialog.error"),
    updateSuccess: t("editDialog.success"),
    updateError: t("editDialog.error"),
    deleteSuccess: t("deleteDialog.success"),
    deleteError: t("deleteDialog.error"),
  });

  const FILTERS: { key: Filter; label: string }[] = [
    { key: "all", label: t("filter.all") },
    { key: "upcoming", label: t("filter.upcoming") },
    { key: "done", label: t("filter.done") },
    { key: "cancelled", label: t("filter.cancelled") },
  ];

  const visible =
    filter === "all" ? meetings : meetings.filter((m) => m.status === filter);

  function handleEdit(meeting: MeetingRecord) {
    setEditMeeting(meeting);
    setEditOpen(true);
  }

  function handleSummary(meeting: MeetingRecord) {
    setSummaryMeeting(meeting);
    setSummaryOpen(true);
  }

  async function handleSummarySubmit(
    meetingId: string,
    summary: string | null,
  ): Promise<boolean> {
    return updateMeeting(meetingId, { summary });
  }

  function handleDeleteRequest(meetingId: string) {
    setDeleteTarget(meetingId);
    setDeleteOpen(true);
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    await deleteMeeting(deleteTarget);
    setDeleteOpen(false);
    setDeleteTarget(null);
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("pageTitle")}
        </h1>
        <CreateMeetingDialog
          onSubmit={createMeeting}
          creating={creating}
          availableLabels={availableLabels}
          availableContacts={availableContacts}
        >
          <Button
            type="button"
            size="sm"
            className="cursor-pointer"
            aria-label={t("newMeeting")}
          >
            <Plus className="size-4" />
            {t("newMeeting")}
          </Button>
        </CreateMeetingDialog>
      </div>

      {/* Filter tabs */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <Button
            key={f.key}
            variant={filter === f.key ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setFilter(f.key)}
            className="cursor-pointer"
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* List */}
      {visible.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {filter === "all" ? t("empty") : t("emptyFiltered")}
        </p>
      ) : (
        <div className="space-y-2">
          {visible.map((meeting) => (
            <MeetingCard
              key={meeting.id}
              meeting={meeting}
              isUpdating={updating === meeting.id}
              isDeleting={deleting === meeting.id}
              onEdit={handleEdit}
              onDelete={handleDeleteRequest}
              onSummary={handleSummary}
            />
          ))}
        </div>
      )}

      {/* Summary dialog */}
      <SummaryDialog
        key={`summary-${summaryMeeting?.id ?? "none"}`}
        meeting={summaryMeeting}
        open={summaryOpen}
        onOpenChange={setSummaryOpen}
        onSubmit={handleSummarySubmit}
        updating={updating !== null}
      />

      {/* Edit dialog */}
      <EditMeetingDialog
        key={`edit-${editMeeting?.id ?? "none"}`}
        meeting={editMeeting}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSubmit={updateMeeting}
        updating={updating !== null}
        availableLabels={availableLabels}
        availableContacts={availableContacts}
      />

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteDialog.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteDialog.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">
              {t("deleteDialog.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="cursor-pointer"
            >
              {t("deleteDialog.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
