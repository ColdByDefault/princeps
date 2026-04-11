/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import { useState, useTransition } from "react";
import { Plus, RefreshCw } from "lucide-react";
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
import { MeetingDetailDialog } from "./MeetingDetailDialog";
import { CreateMeetingDialog } from "./CreateMeetingDialog";
import { EditMeetingDialog } from "./EditMeetingDialog";
import { SummaryDialog } from "./SummaryDialog";
import { PrepPackDialog } from "./PrepPackDialog";
import { useMeetingMutations } from "./logic/useMeetingMutations";
import type {
  LabelOptionRecord,
  MeetingRecord,
  ContactRecord,
  TaskRecord,
} from "@/types/api";

type Filter = "all" | "upcoming" | "done" | "cancelled";

type MeetingsShellProps = {
  initialMeetings: MeetingRecord[];
  availableLabels: LabelOptionRecord[];
  availableContacts: ContactRecord[];
  availableTasks: TaskRecord[];
  hasGoogleCalendar?: boolean;
};

export function MeetingsShell({
  initialMeetings,
  availableLabels,
  availableContacts,
  availableTasks,
  hasGoogleCalendar = false,
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
  const [prepPackMeeting, setPrepPackMeeting] = useState<MeetingRecord | null>(
    null,
  );
  const [prepPackOpen, setPrepPackOpen] = useState(false);
  const [detailMeeting, setDetailMeeting] = useState<MeetingRecord | null>(
    null,
  );
  const [detailOpen, setDetailOpen] = useState(false);

  const [isPendingRefresh, startRefresh] = useTransition();

  function handleRefresh() {
    startRefresh(async () => {
      if (hasGoogleCalendar) {
        await fetch("/api/integrations/google-calendar/sync", {
          method: "POST",
        });
      }
      const res = await fetch("/api/meetings");
      if (res.ok) {
        const { meetings: updated } = (await res.json()) as {
          meetings: MeetingRecord[];
        };
        setMeetings(updated);
      }
    });
  }

  const {
    creating,
    updating,
    deleting,
    generatingPrepPack,
    deletingPrepPack,
    createMeeting,
    updateMeeting,
    deleteMeeting,
    generatePrepPack,
    deletePrepPack,
  } = useMeetingMutations(setMeetings, {
    createSuccess: t("createDialog.success"),
    createError: t("createDialog.error"),
    updateSuccess: t("editDialog.success"),
    updateError: t("editDialog.error"),
    deleteSuccess: t("deleteDialog.success"),
    deleteError: t("deleteDialog.error"),
    prepPackSuccess: t("prepPackDialog.success"),
    prepPackError: t("prepPackDialog.error"),
    deletePrepPackSuccess: t("prepPackDialog.deleteSuccess"),
    deletePrepPackError: t("prepPackDialog.deleteError"),
  });

  const FILTERS: { key: Filter; label: string }[] = [
    { key: "all", label: t("filter.all") },
    { key: "upcoming", label: t("filter.upcoming") },
    { key: "done", label: t("filter.done") },
    { key: "cancelled", label: t("filter.cancelled") },
  ];

  const visible = (() => {
    const filtered =
      filter === "all" ? meetings : meetings.filter((m) => m.status === filter);
    return [...filtered].sort((a, b) => {
      const aUp = a.status === "upcoming";
      const bUp = b.status === "upcoming";
      if (aUp && !bUp) return -1;
      if (!aUp && bUp) return 1;
      // Both upcoming: nearest first
      if (aUp && bUp)
        return (
          new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
        );
      // Both past: most recent first
      return (
        new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()
      );
    });
  })();

  function handleEdit(meeting: MeetingRecord) {
    setEditMeeting(meeting);
    setEditOpen(true);
  }

  function handleSummary(meeting: MeetingRecord) {
    setSummaryMeeting(meeting);
    setSummaryOpen(true);
  }

  function handlePrepPack(meeting: MeetingRecord) {
    setPrepPackMeeting(meeting);
    setPrepPackOpen(true);
  }

  function handleDetail(meeting: MeetingRecord) {
    setDetailMeeting(meeting);
    setDetailOpen(true);
  }

  async function handlePrepPackGenerate(meetingId: string): Promise<boolean> {
    return generatePrepPack(meetingId);
    // After success, useMeetingMutations calls setMeetings with the updated record.
    // MeetingsShell's meeting prop to PrepPackDialog reads from meetings via find(),
    // so the updated prepPack flows in automatically on the next render.
  }

  async function handlePrepPackDelete(meetingId: string): Promise<boolean> {
    return deletePrepPack(meetingId);
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
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPendingRefresh}
            onClick={handleRefresh}
            aria-label={t("refresh")}
            className="cursor-pointer"
          >
            <RefreshCw
              className={`size-3.5 ${isPendingRefresh ? "animate-spin" : ""}`}
            />
            {isPendingRefresh ? t("refreshing") : t("refresh")}
          </Button>
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
      </div>

      {/* Filter tabs */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <Button
            key={f.key}
            type="button"
            variant={filter === f.key ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f.key)}
            className="cursor-pointer rounded-full px-3 text-xs"
          >
            {f.label}
            {f.key === "all"
              ? ` (${meetings.length})`
              : ` (${meetings.filter((m) => m.status === f.key).length})`}
          </Button>
        ))}
      </div>

      {/* List */}
      {visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 px-6 py-16 text-center">
          <p className="text-sm text-muted-foreground">
            {filter === "all" ? t("empty") : t("emptyFiltered")}
          </p>
          {filter === "all" && (
            <CreateMeetingDialog
              onSubmit={createMeeting}
              creating={creating}
              availableLabels={availableLabels}
              availableContacts={availableContacts}
            >
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4 cursor-pointer"
              >
                <Plus className="size-4" />
                {t("newMeeting")}
              </Button>
            </CreateMeetingDialog>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map((meeting) => (
            <MeetingCard
              key={meeting.id}
              meeting={meeting}
              isUpdating={updating === meeting.id}
              isDeleting={deleting === meeting.id}
              isGeneratingPrepPack={generatingPrepPack === meeting.id}
              onEdit={handleEdit}
              onDelete={handleDeleteRequest}
              onSummary={handleSummary}
              onPrepPack={handlePrepPack}
              onDetail={handleDetail}
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

      {/* Prep pack dialog */}
      <PrepPackDialog
        key={`prep-pack-${prepPackMeeting?.id ?? "none"}`}
        meeting={
          prepPackMeeting
            ? (meetings.find((m) => m.id === prepPackMeeting.id) ??
              prepPackMeeting)
            : null
        }
        open={prepPackOpen}
        onOpenChange={setPrepPackOpen}
        onGenerate={handlePrepPackGenerate}
        generating={generatingPrepPack !== null}
        onDelete={handlePrepPackDelete}
        deleting={deletingPrepPack !== null}
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
        availableTasks={availableTasks}
      />

      {/* Detail dialog */}
      <MeetingDetailDialog
        meeting={detailMeeting}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onEdit={(m) => {
          setDetailOpen(false);
          handleEdit(m);
        }}
        onDelete={(id) => {
          setDetailOpen(false);
          handleDeleteRequest(id);
        }}
        onSummary={(m) => {
          setDetailOpen(false);
          handleSummary(m);
        }}
        onPrepPack={(m) => {
          setDetailOpen(false);
          handlePrepPack(m);
        }}
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
