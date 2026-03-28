/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { NoticePanel } from "@/components/shared";
import { useNotice } from "@/components/shared";
import { getMessage } from "@/lib/i18n";
import type { PersonalInfoFields } from "@/types/api";
import type { MessageDictionary } from "@/types/i18n";

// These keys are always shown and always sent to the LLM regardless of whether
// the user fills them in. Their order is stable here so the LLM sees them
// consistently. Do not reorder without also updating personal-info.slot.ts.
const CONSTANT_KEYS = [
  "name",
  "age",
  "jobTitle",
  "company",
  "location",
  "bio",
] as const;

type ConstantKey = (typeof CONSTANT_KEYS)[number];

interface PersonalInfoFormProps {
  messages: MessageDictionary;
  initialFields: PersonalInfoFields;
}

export function PersonalInfoForm({
  messages,
  initialFields,
}: PersonalInfoFormProps) {
  const { addNotice } = useNotice();

  const [constantValues, setConstantValues] = useState<
    Record<ConstantKey, string>
  >(() => {
    const acc = {} as Record<ConstantKey, string>;
    for (const k of CONSTANT_KEYS) {
      const v = initialFields[k];
      acc[k] = v == null ? "" : String(v);
    }
    return acc;
  });

  const [extraRows, setExtraRows] = useState<{ key: string; value: string }[]>(
    () =>
      Object.entries(initialFields)
        .filter(([k]) => !(CONSTANT_KEYS as readonly string[]).includes(k))
        .map(([k, v]) => ({ key: k, value: v == null ? "" : String(v) })),
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addExtraRow() {
    setExtraRows((prev) => [...prev, { key: "", value: "" }]);
  }

  function removeExtraRow(index: number) {
    setExtraRows((prev) => prev.filter((_, i) => i !== index));
  }

  function updateExtraRow(
    index: number,
    field: "key" | "value",
    value: string,
  ) {
    setExtraRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );
  }

  async function handleSave() {
    setError(null);
    setSaving(true);

    const fields: PersonalInfoFields = { ...constantValues };
    for (const row of extraRows) {
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
    <div className="space-y-6">
      {error && (
        <NoticePanel
          type="error"
          title={error}
          dismissLabel={getMessage(messages, "shared.dismiss", "Dismiss")}
          onDismiss={() => setError(null)}
        />
      )}

      {/* ── Core fields ─────────────────────────────────────────────── */}
      <section className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {getMessage(
            messages,
            "knowledge.personalInfo.coreSection",
            "Core details",
          )}
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          {(["name", "age", "jobTitle", "company", "location"] as const).map(
            (key) => (
              <div key={key} className="flex flex-col gap-1">
                <label className="text-sm font-medium">
                  {getMessage(
                    messages,
                    `knowledge.personalInfo.field.${key}`,
                    key,
                  )}
                </label>
                <Input
                  value={constantValues[key]}
                  onChange={(e) =>
                    setConstantValues((prev) => ({
                      ...prev,
                      [key]: e.target.value,
                    }))
                  }
                  placeholder={getMessage(
                    messages,
                    `knowledge.personalInfo.field.${key}.placeholder`,
                    "",
                  )}
                />
              </div>
            ),
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">
            {getMessage(messages, "knowledge.personalInfo.field.bio", "Bio")}
          </label>
          <Textarea
            value={constantValues.bio}
            onChange={(e) =>
              setConstantValues((prev) => ({ ...prev, bio: e.target.value }))
            }
            placeholder={getMessage(
              messages,
              "knowledge.personalInfo.field.bio.placeholder",
              "Short note about yourself",
            )}
            rows={3}
            className="resize-none"
          />
        </div>
      </section>

      <Separator />

      {/* ── Extra fields ─────────────────────────────────────────────── */}
      <section className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {getMessage(
            messages,
            "knowledge.personalInfo.extraSection",
            "Additional context",
          )}
        </p>

        {extraRows.length > 0 && (
          <ul className="space-y-2">
            {extraRows.map((row, i) => (
              <li key={i} className="flex items-center gap-2">
                <Input
                  value={row.key}
                  onChange={(e) => updateExtraRow(i, "key", e.target.value)}
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
                  onChange={(e) => updateExtraRow(i, "value", e.target.value)}
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
                  onClick={() => removeExtraRow(i)}
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

        <Button
          variant="outline"
          size="sm"
          className="cursor-pointer gap-1.5"
          onClick={addExtraRow}
        >
          <Plus className="size-4" />
          {getMessage(
            messages,
            "knowledge.personalInfo.addField",
            "Add custom field",
          )}
        </Button>
      </section>

      {/* ── Save ─────────────────────────────────────────────────────── */}
      <div className="flex justify-end pt-1">
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
