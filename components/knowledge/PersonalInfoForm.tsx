/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NoticePanel } from "@/components/shared";
import { useNotice } from "@/components/shared";
import { getMessage } from "@/lib/i18n";
import type { PersonalInfoFields } from "@/types/api";
import type { MessageDictionary } from "@/types/i18n";

interface PersonalInfoFormProps {
  messages: MessageDictionary;
  initialFields: PersonalInfoFields;
}

export function PersonalInfoForm({
  messages,
  initialFields,
}: PersonalInfoFormProps) {
  const { addNotice } = useNotice();
  const [rows, setRows] = useState<{ key: string; value: string }[]>(() =>
    Object.entries(initialFields).map(([k, v]) => ({
      key: k,
      value: v == null ? "" : String(v),
    })),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addRow() {
    setRows((prev) => [...prev, { key: "", value: "" }]);
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  function updateRow(index: number, field: "key" | "value", value: string) {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );
  }

  async function handleSave() {
    setError(null);
    setSaving(true);

    const fields: PersonalInfoFields = {};
    for (const row of rows) {
      const k = row.key.trim();
      if (k) fields[k] = row.value.trim();
    }

    try {
      const res = await fetch("/api/knowledge/personal-info", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(
          data.error ??
            getMessage(
              messages,
              "knowledge.personalInfo.saveError",
              "Failed to save. Please try again.",
            ),
        );
      }

      addNotice({
        type: "success",
        title: getMessage(
          messages,
          "knowledge.personalInfo.saved",
          "Personal info saved.",
        ),
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : getMessage(
              messages,
              "knowledge.personalInfo.saveError",
              "Failed to save. Please try again.",
            ),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <NoticePanel
          type="error"
          title={error}
          dismissLabel={getMessage(messages, "shared.dismiss", "Dismiss")}
          onDismiss={() => setError(null)}
        />
      )}

      {rows.length === 0 && (
        <div className="rounded-xl border border-dashed border-border/70 bg-card/40 px-6 py-10 text-center">
          <p className="font-medium">
            {getMessage(
              messages,
              "knowledge.personalInfo.empty",
              "No personal info saved yet.",
            )}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {getMessage(
              messages,
              "knowledge.personalInfo.emptyBody",
              "Add your name, job, location, or any context the assistant should know about you.",
            )}
          </p>
        </div>
      )}

      {rows.length > 0 && (
        <ul className="space-y-2">
          {rows.map((row, i) => (
            <li key={i} className="flex items-center gap-2">
              <Input
                value={row.key}
                onChange={(e) => updateRow(i, "key", e.target.value)}
                placeholder={getMessage(
                  messages,
                  "knowledge.personalInfo.keyPlaceholder",
                  "Field name",
                )}
                className="w-36 shrink-0"
                aria-label={getMessage(
                  messages,
                  "knowledge.personalInfo.keyPlaceholder",
                  "Field name",
                )}
              />
              <Input
                value={row.value}
                onChange={(e) => updateRow(i, "value", e.target.value)}
                placeholder={getMessage(
                  messages,
                  "knowledge.personalInfo.valuePlaceholder",
                  "Value",
                )}
                className="flex-1"
                aria-label={getMessage(
                  messages,
                  "knowledge.personalInfo.valuePlaceholder",
                  "Value",
                )}
              />
              <Button
                variant="ghost"
                size="icon"
                className="cursor-pointer shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => removeRow(i)}
                aria-label={getMessage(
                  messages,
                  "knowledge.personalInfo.removeField",
                  "Remove field",
                )}
              >
                <X className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center justify-between pt-2">
        <Button
          variant="outline"
          size="sm"
          className="cursor-pointer gap-1.5"
          onClick={addRow}
          aria-label={getMessage(
            messages,
            "knowledge.personalInfo.addField",
            "Add field",
          )}
        >
          <Plus className="size-4" />
          {getMessage(messages, "knowledge.personalInfo.addField", "Add field")}
        </Button>

        <Button
          size="sm"
          disabled={saving}
          onClick={() => void handleSave()}
          className="cursor-pointer"
        >
          {saving
            ? getMessage(
                messages,
                "knowledge.personalInfo.saving",
                "Saving\u2026",
              )
            : getMessage(messages, "knowledge.personalInfo.save", "Save")}
        </Button>
      </div>
    </div>
  );
}
