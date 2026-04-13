"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon, ChevronUp, ChevronDown } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DateTimePickerProps {
  /** Empty string or "YYYY-MM-DDThh:mm" (datetime-local format). */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function parseTo12h(time24: string): {
  hour12: number;
  minute: number;
  period: "AM" | "PM";
} {
  const [hStr, mStr] = time24.split(":");
  const h = parseInt(hStr ?? "9", 10);
  const m = parseInt(mStr ?? "0", 10);
  return {
    hour12: h % 12 === 0 ? 12 : h % 12,
    minute: m,
    period: h < 12 ? "AM" : "PM",
  };
}

function to24h(hour12: number, minute: number, period: "AM" | "PM"): string {
  let h = hour12 % 12;
  if (period === "PM") h += 12;
  return `${String(h).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

// ─── spinner control ──────────────────────────────────────────────────────────

function Spinner({
  value,
  onIncrement,
  onDecrement,
  label,
}: {
  value: string;
  onIncrement: () => void;
  onDecrement: () => void;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5" aria-label={label}>
      <button
        type="button"
        onClick={onIncrement}
        aria-label={`Increase ${label}`}
        className="flex size-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <ChevronUp className="size-4" />
      </button>
      <span className="w-9 select-none text-center text-lg font-semibold tabular-nums">
        {value}
      </span>
      <button
        type="button"
        onClick={onDecrement}
        aria-label={`Decrease ${label}`}
        className="flex size-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <ChevronDown className="size-4" />
      </button>
    </div>
  );
}

// ─── main component ────────────────────────────────────────────────────────────

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Pick a date & time",
  disabled,
  className,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);

  const datePart = value.slice(0, 10);
  const timePart = value.length > 10 ? value.slice(11) : "09:00";

  const { hour12, minute, period } = parseTo12h(timePart);
  const selected = datePart ? new Date(datePart + "T" + timePart) : undefined;

  function emit(h: number, m: number, p: "AM" | "PM") {
    if (datePart) onChange(datePart + "T" + to24h(h, m, p));
  }

  function handleDateSelect(date: Date | undefined) {
    onChange(date ? format(date, "yyyy-MM-dd") + "T" + timePart : "");
  }

  const displayLabel = selected
    ? `${format(selected, "PP")}  ${String(hour12).padStart(2, "0")}:${String(minute).padStart(2, "0")} ${period}`
    : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            aria-label={placeholder}
            className={cn(
              "w-full justify-start text-left font-normal cursor-pointer",
              !value && "text-muted-foreground",
              className,
            )}
          />
        }
      >
        <CalendarIcon className="mr-2 size-4 shrink-0" />
        {displayLabel ? (
          <span>{displayLabel}</span>
        ) : (
          <span>{placeholder}</span>
        )}
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0" align="start" side="bottom">
        {/* Date */}
        <Calendar
          mode="single"
          selected={selected}
          onSelect={handleDateSelect}
          captionLayout="label"
        />

        {/* Time */}
        <div
          className={cn(
            "border-t px-4 pb-4 pt-3",
            !datePart && "opacity-40 pointer-events-none",
          )}
        >
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {datePart ? "Time" : "Pick a date first"}
          </p>
          <div className="flex items-center justify-center gap-2">
            {/* Hour */}
            <Spinner
              label="hour"
              value={String(hour12).padStart(2, "0")}
              onIncrement={() =>
                emit(hour12 === 12 ? 1 : hour12 + 1, minute, period)
              }
              onDecrement={() =>
                emit(hour12 === 1 ? 12 : hour12 - 1, minute, period)
              }
            />

            <span className="mb-0.5 text-xl font-bold text-muted-foreground">
              :
            </span>

            {/* Minute */}
            <Spinner
              label="minute"
              value={String(minute).padStart(2, "0")}
              onIncrement={() => emit(hour12, (minute + 1) % 60, period)}
              onDecrement={() => emit(hour12, (minute + 59) % 60, period)}
            />

            {/* AM / PM */}
            <div className="ml-2 flex flex-col gap-1">
              {(["AM", "PM"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => emit(hour12, minute, p)}
                  className={cn(
                    "cursor-pointer rounded-md px-2.5 py-1 text-sm font-medium transition-colors",
                    period === p
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
