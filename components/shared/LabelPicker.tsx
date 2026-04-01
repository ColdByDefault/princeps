/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { getMessage } from "@/lib/i18n";
import type { LabelOptionRecord } from "@/types/api";
import type { MessageDictionary } from "@/types/i18n";

type Props = {
  messages: MessageDictionary;
  inputId: string;
  fieldLabel: string;
  availableLabels: LabelOptionRecord[];
  selectedLabelIds: string[];
  onChange: (labelIds: string[]) => void;
};

export function LabelPicker({
  messages,
  inputId,
  fieldLabel,
  availableLabels,
  selectedLabelIds,
  onChange,
}: Props) {
  const selectedLabels = availableLabels.filter((label) =>
    selectedLabelIds.includes(label.id),
  );

  function toggleLabel(labelId: string) {
    onChange(
      selectedLabelIds.includes(labelId)
        ? selectedLabelIds.filter((id) => id !== labelId)
        : [...selectedLabelIds, labelId],
    );
  }

  return (
    <div className="grid gap-1.5">
      <Label htmlFor={inputId}>{fieldLabel}</Label>

      {availableLabels.length === 0 ? (
        <div className="rounded-md border border-dashed border-border/70 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
          {getMessage(
            messages,
            "labels.picker.empty",
            "No labels available yet. Create labels in App Settings first.",
          )}
        </div>
      ) : (
        <div
          id={inputId}
          className="space-y-2 rounded-md border border-border/70 bg-background/60 p-3"
        >
          <div className="flex flex-wrap gap-1.5">
            {selectedLabels.length > 0 ? (
              selectedLabels.map((label) => (
                <Badge key={label.id} variant="secondary">
                  {label.name}
                </Badge>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">
                {getMessage(
                  messages,
                  "labels.picker.noneSelected",
                  "No labels selected.",
                )}
              </p>
            )}
          </div>

          <div className="max-h-32 space-y-1.5 overflow-y-auto pr-1">
            {availableLabels.map((label) => {
              const checked = selectedLabelIds.includes(label.id);

              return (
                <label
                  key={label.id}
                  htmlFor={`${inputId}-${label.id}`}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted/50"
                >
                  <Checkbox
                    id={`${inputId}-${label.id}`}
                    checked={checked}
                    onCheckedChange={() => toggleLabel(label.id)}
                  />
                  <span>{label.name}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
