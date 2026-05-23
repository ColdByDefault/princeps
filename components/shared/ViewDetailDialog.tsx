/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.7
 * @since canary-v1.1.7
 */

"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * A single row in the detail view.
 * Pass `hidden: true` to suppress the row (e.g. when the value is null/empty).
 */
export type DetailField = {
  label: string;
  value: React.ReactNode;
  /** When true the field is not rendered. */
  hidden?: boolean;
};

type ViewDetailDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Shown as the dialog heading. */
  title: string;
  fields: DetailField[];
};

/**
 * Generic read-only detail dialog.
 * Renders a label/value list for any entity — tasks, contacts, meetings, etc.
 * Callers build the `fields` array and pass localized labels and ReactNode values.
 */
export function ViewDetailDialog({
  open,
  onOpenChange,
  title,
  fields,
}: ViewDetailDialogProps) {
  const visible = fields.filter((f) => !f.hidden);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto">
          <dl className="divide-y divide-border/60">
            {visible.map((field, i) => (
              <div key={i} className="flex gap-4 py-2.5">
                <dt className="w-28 shrink-0 pt-0.5 text-xs font-medium text-muted-foreground">
                  {field.label}
                </dt>
                <dd className="min-w-0 flex-1 text-sm text-foreground">
                  {field.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </DialogContent>
    </Dialog>
  );
}
