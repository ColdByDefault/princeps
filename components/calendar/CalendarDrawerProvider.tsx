/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import React, { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { CalendarDrawerContext } from "./CalendarDrawerContext";
import { CalendarDrawer } from "./CalendarDrawer";
import { useCalendarData } from "./logic/useCalendarData";

export function CalendarDrawerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());

  const tTasks = useTranslations("tasks");
  const tMeetings = useTranslations("meetings");

  const {
    tasks,
    meetings,
    labels,
    goals,
    contacts,
    loading,
    fetchData,
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
  } = useCalendarData({
    createTaskSuccess: tTasks("createDialog.success"),
    createTaskError: tTasks("createDialog.error"),
    updateTaskSuccess: tTasks("editDialog.success"),
    updateTaskError: tTasks("editDialog.error"),
    deleteTaskSuccess: tTasks("deleteDialog.success"),
    deleteTaskError: tTasks("deleteDialog.error"),
    createMeetingSuccess: tMeetings("createDialog.success"),
    createMeetingError: tMeetings("createDialog.error"),
    updateMeetingSuccess: tMeetings("editDialog.success"),
    updateMeetingError: tMeetings("editDialog.error"),
    deleteMeetingSuccess: tMeetings("deleteDialog.success"),
    deleteMeetingError: tMeetings("deleteDialog.error"),
  });

  const openCalendar = useCallback(
    (date?: Date) => {
      if (date) setSelectedDate(date);
      setOpen(true);
      void fetchData();
    },
    [fetchData],
  );

  const closeCalendar = useCallback(() => {
    setOpen(false);
  }, []);

  return (
    <CalendarDrawerContext.Provider
      value={{ open, openCalendar, closeCalendar }}
    >
      {children}
      <Sheet open={open} onOpenChange={(v) => !v && closeCalendar()}>
        <SheetContent
          side="right"
          showCloseButton={false}
          className="w-full sm:w-auto sm:max-w-none p-0 gap-0 flex flex-col"
        >
          <CalendarDrawer
            onClose={closeCalendar}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            tasks={tasks}
            meetings={meetings}
            labels={labels}
            goals={goals}
            contacts={contacts}
            loading={loading}
            creatingTask={creatingTask}
            createTask={createTask}
            updatingTask={updatingTask}
            updateTask={updateTask}
            deletingTask={deletingTask}
            deleteTask={deleteTask}
            creatingMeeting={creatingMeeting}
            createMeeting={createMeeting}
            updatingMeeting={updatingMeeting}
            updateMeeting={updateMeeting}
            deletingMeeting={deletingMeeting}
            deleteMeeting={deleteMeeting}
          />
        </SheetContent>
      </Sheet>
    </CalendarDrawerContext.Provider>
  );
}
