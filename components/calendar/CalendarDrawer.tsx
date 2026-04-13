/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import React, { useState, useMemo } from "react";
import { format, isSameDay } from "date-fns";
import { useTranslations } from "next-intl";
import { X, Plus, Pencil, Trash2, CalendarDays, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog";
import { EditTaskDialog } from "@/components/tasks/EditTaskDialog";
import { CreateMeetingDialog } from "@/components/meetings/CreateMeetingDialog";
import { EditMeetingDialog } from "@/components/meetings/EditMeetingDialog";
import { cn } from "@/lib/utils";
import type {
  TaskRecord,
  MeetingRecord,
  LabelOptionRecord,
  ContactRecord,
} from "@/types/api";

type CalendarDrawerProps = {
  onClose: () => void;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  tasks: TaskRecord[];
  meetings: MeetingRecord[];
  labels: LabelOptionRecord[];
  goals: { id: string; title: string }[];
  contacts: ContactRecord[];
  loading: boolean;
  // Task mutations
  creatingTask: boolean;
  createTask: (input: {
    title: string;
    notes?: string;
    priority?: string;
    dueDate?: string | null;
    labelIds?: string[];
    goalIds?: string[];
  }) => Promise<boolean>;
  updatingTask: string | null;
  updateTask: (
    taskId: string,
    input: Partial<{
      title: string;
      notes: string | null;
      status: string;
      priority: string;
      dueDate: string | null;
      labelIds: string[];
      goalIds: string[];
    }>,
  ) => Promise<boolean>;
  deletingTask: string | null;
  deleteTask: (taskId: string) => Promise<boolean>;
  // Meeting mutations
  creatingMeeting: boolean;
  createMeeting: (input: {
    title: string;
    scheduledAt: string;
    durationMin?: number | null;
    location?: string | null;
    agenda?: string | null;
    labelIds?: string[];
    participantContactIds?: string[];
    pushToGoogle?: boolean;
  }) => Promise<boolean>;
  updatingMeeting: string | null;
  updateMeeting: (
    meetingId: string,
    input: Partial<{
      title: string;
      scheduledAt: string;
      durationMin: number | null;
      location: string | null;
      status: string;
      kind: string;
      agenda: string | null;
      labelIds: string[];
      participantContactIds: string[];
      linkedTaskIds: string[];
    }>,
  ) => Promise<boolean>;
  deletingMeeting: string | null;
  deleteMeeting: (meetingId: string) => Promise<boolean>;
};

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function formatMeetingTime(iso: string): string {
  try {
    return format(new Date(iso), "HH:mm");
  } catch {
    return "";
  }
}

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "bg-red-500",
  high: "bg-orange-400",
  normal: "bg-blue-400",
  low: "bg-muted-foreground/50",
};

export function CalendarDrawer({
  onClose,
  selectedDate,
  onSelectDate,
  tasks,
  meetings,
  labels,
  goals,
  contacts,
  loading,
  creatingTask,
  createTask,
  updatingTask,
  updateTask,
  deletingTask,
  deleteTask,
  creatingMeeting,
  createMeeting,
  updatingMeeting,
  updateMeeting,
  deletingMeeting,
  deleteMeeting,
}: CalendarDrawerProps) {
  const t = useTranslations("calendar");
  const tTasks = useTranslations("tasks");
  const tMeetings = useTranslations("meetings");

  const [editTask, setEditTask] = useState<TaskRecord | null>(null);
  const [editTaskOpen, setEditTaskOpen] = useState(false);
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);

  const [editMeeting, setEditMeeting] = useState<MeetingRecord | null>(null);
  const [editMeetingOpen, setEditMeetingOpen] = useState(false);
  const [deleteMeetingId, setDeleteMeetingId] = useState<string | null>(null);

  // Build sets of days that have tasks/meetings for calendar indicators
  const taskDatesSet = useMemo(() => {
    const s = new Set<string>();
    for (const task of tasks) {
      if (task.dueDate) s.add(dayKey(new Date(task.dueDate)));
    }
    return s;
  }, [tasks]);

  const meetingDatesSet = useMemo(() => {
    const s = new Set<string>();
    for (const meeting of meetings) {
      if (meeting.scheduledAt) s.add(dayKey(new Date(meeting.scheduledAt)));
    }
    return s;
  }, [meetings]);

  // Filter tasks and meetings for the selected day
  const selectedDayTasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          task.dueDate && isSameDay(new Date(task.dueDate), selectedDate),
      ),
    [tasks, selectedDate],
  );

  const selectedDayMeetings = useMemo(
    () =>
      meetings.filter(
        (m) =>
          m.scheduledAt && isSameDay(new Date(m.scheduledAt), selectedDate),
      ),
    [meetings, selectedDate],
  );

  // Date strings for pre-filling create forms
  const initialDueDateStr = format(selectedDate, "yyyy-MM-dd");
  const initialScheduledAtStr = format(selectedDate, "yyyy-MM-dd") + "T09:00";

  function handleEditTask(task: TaskRecord) {
    setEditTask(task);
    setEditTaskOpen(true);
  }

  function handleEditMeeting(meeting: MeetingRecord) {
    setEditMeeting(meeting);
    setEditMeetingOpen(true);
  }

  async function handleDeleteTaskConfirm() {
    if (!deleteTaskId) return;
    await deleteTask(deleteTaskId);
    setDeleteTaskId(null);
  }

  async function handleDeleteMeetingConfirm() {
    if (!deleteMeetingId) return;
    await deleteMeeting(deleteMeetingId);
    setDeleteMeetingId(null);
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Left: Calendar ── */}
      <div className="flex shrink-0 flex-col gap-3 border-r border-border/60 bg-muted/20 p-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="size-4 text-primary" />
          <h2 className="text-sm font-semibold tracking-tight">{t("title")}</h2>
        </div>

        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => {
            if (date) onSelectDate(date);
          }}
          components={{
            DayButton: ({ children, day, modifiers, ...props }) => {
              const key = dayKey(day.date);
              const hasTask = taskDatesSet.has(key);
              const hasMeeting = meetingDatesSet.has(key);
              return (
                <CalendarDayButton day={day} modifiers={modifiers} {...props}>
                  {children}
                  {(hasTask || hasMeeting) && (
                    <span className="flex gap-0.5 justify-center opacity-100!">
                      {hasTask && (
                        <i className="size-1 block rounded-full bg-blue-400" />
                      )}
                      {hasMeeting && (
                        <i className="size-1 block rounded-full bg-emerald-400" />
                      )}
                    </span>
                  )}
                </CalendarDayButton>
              );
            },
          }}
        />

        {/* Legend */}
        <div className="flex flex-col gap-1 px-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <i className="size-2 block rounded-full bg-blue-400 shrink-0" />
            {t("legendTasks")}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <i className="size-2 block rounded-full bg-emerald-400 shrink-0" />
            {t("legendMeetings")}
          </div>
        </div>
      </div>

      {/* ── Right: Day detail ── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border/60 px-5 py-3.5">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              {format(selectedDate, "EEEE")}
            </p>
            <h3 className="text-xl font-semibold leading-tight">
              {format(selectedDate, "d MMMM yyyy")}
            </h3>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t("close")}
                    onClick={onClose}
                    className="cursor-pointer"
                  />
                }
              >
                <X className="size-4" />
              </TooltipTrigger>
              <TooltipContent>{t("close")}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-muted-foreground">{t("loading")}</p>
            </div>
          ) : (
            <>
              {/* ── Tasks for this day ── */}
              <section>
                <div className="mb-2.5 flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("tasksSection")}
                    {selectedDayTasks.length > 0 && (
                      <span className="ml-1.5 tabular-nums">
                        ({selectedDayTasks.length})
                      </span>
                    )}
                  </h4>
                  <CreateTaskDialog
                    onSubmit={createTask}
                    creating={creatingTask}
                    availableLabels={labels}
                    availableGoals={goals}
                    initialDueDate={initialDueDateStr}
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={tTasks("newTask")}
                      className="cursor-pointer"
                    >
                      <Plus className="size-3.5" />
                    </Button>
                  </CreateTaskDialog>
                </div>

                {selectedDayTasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {t("noTasksOnDay")}
                  </p>
                ) : (
                  <ul className="space-y-1.5">
                    {selectedDayTasks.map((task) => (
                      <li
                        key={task.id}
                        className="group flex items-center gap-2.5 rounded-lg border border-border/60 bg-card px-3 py-2 text-sm hover:bg-accent/30"
                      >
                        <span
                          className={cn(
                            "size-2 shrink-0 rounded-full",
                            PRIORITY_COLORS[task.priority] ??
                              PRIORITY_COLORS.normal,
                          )}
                        />
                        <span
                          className={cn(
                            "flex-1 truncate",
                            task.status === "done" &&
                              "line-through text-muted-foreground",
                          )}
                        >
                          {task.title}
                        </span>
                        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger
                                render={
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-sm"
                                    aria-label={tTasks("editLabel")}
                                    onClick={() => handleEditTask(task)}
                                    className="cursor-pointer"
                                  />
                                }
                              >
                                <Pencil className="size-3" />
                              </TooltipTrigger>
                              <TooltipContent>
                                {tTasks("editLabel")}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger
                                render={
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-sm"
                                    aria-label={tTasks("deleteLabel")}
                                    onClick={() => setDeleteTaskId(task.id)}
                                    disabled={deletingTask === task.id}
                                    className="cursor-pointer text-destructive hover:text-destructive"
                                  />
                                }
                              >
                                <Trash2 className="size-3" />
                              </TooltipTrigger>
                              <TooltipContent>
                                {tTasks("deleteLabel")}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* ── Meetings for this day ── */}
              <section>
                <div className="mb-2.5 flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("meetingsSection")}
                    {selectedDayMeetings.length > 0 && (
                      <span className="ml-1.5 tabular-nums">
                        ({selectedDayMeetings.length})
                      </span>
                    )}
                  </h4>
                  <CreateMeetingDialog
                    onSubmit={createMeeting}
                    creating={creatingMeeting}
                    availableLabels={labels}
                    availableContacts={contacts}
                    initialScheduledAt={initialScheduledAtStr}
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={tMeetings("newMeeting")}
                      className="cursor-pointer"
                    >
                      <Plus className="size-3.5" />
                    </Button>
                  </CreateMeetingDialog>
                </div>

                {selectedDayMeetings.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {t("noMeetingsOnDay")}
                  </p>
                ) : (
                  <ul className="space-y-1.5">
                    {selectedDayMeetings.map((meeting) => (
                      <li
                        key={meeting.id}
                        className="group flex items-center gap-2.5 rounded-lg border border-border/60 bg-card px-3 py-2 text-sm hover:bg-accent/30"
                      >
                        <Clock className="size-3.5 shrink-0 text-muted-foreground" />
                        <span className="shrink-0 tabular-nums text-xs text-muted-foreground w-9">
                          {formatMeetingTime(meeting.scheduledAt)}
                        </span>
                        <span
                          className={cn(
                            "flex-1 truncate",
                            meeting.status === "cancelled" &&
                              "line-through text-muted-foreground",
                          )}
                        >
                          {meeting.title}
                        </span>
                        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger
                                render={
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-sm"
                                    aria-label={tMeetings("editLabel")}
                                    onClick={() => handleEditMeeting(meeting)}
                                    className="cursor-pointer"
                                  />
                                }
                              >
                                <Pencil className="size-3" />
                              </TooltipTrigger>
                              <TooltipContent>
                                {tMeetings("editLabel")}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger
                                render={
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-sm"
                                    aria-label={tMeetings("deleteLabel")}
                                    onClick={() =>
                                      setDeleteMeetingId(meeting.id)
                                    }
                                    disabled={deletingMeeting === meeting.id}
                                    className="cursor-pointer text-destructive hover:text-destructive"
                                  />
                                }
                              >
                                <Trash2 className="size-3" />
                              </TooltipTrigger>
                              <TooltipContent>
                                {tMeetings("deleteLabel")}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          )}
        </div>
      </div>

      {/* ── Edit Task Dialog ── */}
      <EditTaskDialog
        task={editTask}
        open={editTaskOpen}
        onOpenChange={(v) => {
          setEditTaskOpen(v);
          if (!v) setEditTask(null);
        }}
        onSubmit={updateTask}
        updating={updatingTask !== null}
        availableLabels={labels}
        availableGoals={goals}
      />

      {/* ── Edit Meeting Dialog ── */}
      <EditMeetingDialog
        meeting={editMeeting}
        open={editMeetingOpen}
        onOpenChange={(v) => {
          setEditMeetingOpen(v);
          if (!v) setEditMeeting(null);
        }}
        onSubmit={updateMeeting}
        updating={updatingMeeting !== null}
        availableLabels={labels}
        availableContacts={contacts}
        availableTasks={tasks}
      />

      {/* ── Delete Task Confirmation ── */}
      <AlertDialog
        open={deleteTaskId !== null}
        onOpenChange={(v) => {
          if (!v) setDeleteTaskId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tTasks("deleteDialog.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {tTasks("deleteDialog.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">
              {tTasks("deleteDialog.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              className="cursor-pointer"
              onClick={handleDeleteTaskConfirm}
            >
              {tTasks("deleteDialog.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Delete Meeting Confirmation ── */}
      <AlertDialog
        open={deleteMeetingId !== null}
        onOpenChange={(v) => {
          if (!v) setDeleteMeetingId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {tMeetings("deleteDialog.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {tMeetings("deleteDialog.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">
              {tMeetings("deleteDialog.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              className="cursor-pointer"
              onClick={handleDeleteMeetingConfirm}
            >
              {tMeetings("deleteDialog.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
