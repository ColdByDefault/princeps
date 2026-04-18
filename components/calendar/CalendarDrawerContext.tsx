/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version beta
 * @since beta
 * @module
 * @description
 */

"use client";

import { createContext, useContext } from "react";

export type CalendarDrawerContextValue = {
  open: boolean;
  openCalendar: (date?: Date) => void;
  closeCalendar: () => void;
};

export const CalendarDrawerContext =
  createContext<CalendarDrawerContextValue | null>(null);

export function useCalendarDrawer(): CalendarDrawerContextValue {
  const ctx = useContext(CalendarDrawerContext);
  if (!ctx)
    throw new Error(
      "useCalendarDrawer must be used inside CalendarDrawerProvider",
    );
  return ctx;
}
