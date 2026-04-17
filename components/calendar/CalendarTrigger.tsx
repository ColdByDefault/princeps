/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * SPDX-License-Identifier: Elastic-2.0
 */

"use client";

import { CalendarDays } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCalendarDrawer } from "./CalendarDrawerContext";
import { cn } from "@/lib/utils";

type CalendarTriggerProps = {
  className?: string;
  date?: Date;
};

export function CalendarTrigger({ className, date }: CalendarTriggerProps) {
  const { openCalendar } = useCalendarDrawer();
  const t = useTranslations("calendar");

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label={t("openTrigger")}
              onClick={() => openCalendar(date)}
              className={cn("cursor-pointer", className)}
            />
          }
        >
          <CalendarDays className="size-4" />
        </TooltipTrigger>
        <TooltipContent>{t("openTrigger")}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
