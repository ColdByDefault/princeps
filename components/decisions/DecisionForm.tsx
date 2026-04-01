/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import { useState, useEffect } from "react";
import { LabelPicker } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getMessage } from "@/lib/i18n";
import type { DecisionRecord, LabelOptionRecord } from "@/types/api";
import type { MessageDictionary } from "@/types/i18n";

interface DecisionFormProps {
  messages: MessageDictionary;
  open: boolean;
  initial: DecisionRecord | null;
  availableLabels?: LabelOptionRecord[];
  onClose: () => void;
  onSaved: (decision: DecisionRecord) => void;
}

function toDateInputValue(iso: string | null | undefined): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

export function DecisionForm({
  messages,
  open,
  initial,
  availableLabels = [],
  onClose,
  onSaved,
}: DecisionFormProps) {
  const [title, setTitle] = useState("");
  const [rationale, setRationale] = useState("");
  const [outcome, setOutcome] = useState("");
  const [status, setStatus] = useState("open");
  const [decidedAt, setDecidedAt] = useState("");
  const [labelIds, setLabelIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setTitle(initial?.title ?? "");
      setRationale(initial?.rationale ?? "");
      setOutcome(initial?.outcome ?? "");
      setStatus(initial?.status ?? "open");
      setDecidedAt(toDateInputValue(initial?.decidedAt));
      setLabelIds(initial?.labels.map((label) => label.id) ?? []);
      setError(null);
    }
  }, [open, initial]);

  async function handleSave() {
    if (!title.trim()) return;
    setError(null);
    setSaving(true);

    const payload = {
      title: title.trim(),
      rationale: rationale.trim() || null,
      outcome: outcome.trim() || null,
      status,
      decidedAt: decidedAt ? new Date(decidedAt).toISOString() : null,
      labelIds,
    };

    const isEdit = !!initial;
    const url = isEdit ? `/api/decisions/${initial!.id}` : "/api/decisions";
    const method = isEdit ? "PATCH" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        setError(
          getMessage(
            messages,
            "decisions.saveError",
            "Failed to save decision. Please try again.",
          ),
        );
        setSaving(false);
        return;
      }

      const data = (await res.json()) as { decision: DecisionRecord };
      onSaved(data.decision);
      onClose();
    } catch {
      setError(
        getMessage(
          messages,
          "decisions.saveError",
          "Failed to save decision. Please try again.",
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {initial
              ? getMessage(messages, "decisions.save", "Save")
              : getMessage(messages, "decisions.add", "Add decision")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="decision-title">
              {getMessage(messages, "decisions.field.title", "Title")}
            </Label>
            <Input
              id="decision-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={getMessage(
                messages,
                "decisions.field.title.placeholder",
                "Use TypeScript for the new service",
              )}
            />
          </div>

          {/* Rationale */}
          <div className="space-y-1.5">
            <Label htmlFor="decision-rationale">
              {getMessage(messages, "decisions.field.rationale", "Rationale")}
            </Label>
            <Textarea
              id="decision-rationale"
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              placeholder={getMessage(
                messages,
                "decisions.field.rationale.placeholder",
                "Why this decision makes sense…",
              )}
              rows={2}
            />
          </div>

          {/* Outcome */}
          <div className="space-y-1.5">
            <Label htmlFor="decision-outcome">
              {getMessage(messages, "decisions.field.outcome", "Outcome")}
            </Label>
            <Textarea
              id="decision-outcome"
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              placeholder={getMessage(
                messages,
                "decisions.field.outcome.placeholder",
                "What was decided or what happened…",
              )}
              rows={2}
            />
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <Label>
              {getMessage(messages, "decisions.field.status", "Status")}
            </Label>
            <Select
              value={status}
              onValueChange={(v) => {
                if (v) setStatus(v);
              }}
            >
              <SelectTrigger className="cursor-pointer">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open" className="cursor-pointer">
                  {getMessage(messages, "decisions.status.open", "Open")}
                </SelectItem>
                <SelectItem value="decided" className="cursor-pointer">
                  {getMessage(messages, "decisions.status.decided", "Decided")}
                </SelectItem>
                <SelectItem value="reversed" className="cursor-pointer">
                  {getMessage(
                    messages,
                    "decisions.status.reversed",
                    "Reversed",
                  )}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Decided on */}
          <div className="space-y-1.5">
            <Label htmlFor="decision-decidedAt">
              {getMessage(messages, "decisions.field.decidedAt", "Decided on")}
            </Label>
            <Input
              id="decision-decidedAt"
              type="date"
              value={decidedAt}
              onChange={(e) => setDecidedAt(e.target.value)}
            />
          </div>

          <LabelPicker
            messages={messages}
            inputId="decision-labels"
            fieldLabel={getMessage(
              messages,
              "decisions.field.labels",
              "Labels",
            )}
            availableLabels={availableLabels}
            selectedLabelIds={labelIds}
            onChange={setLabelIds}
          />

          {error && <p className="text-destructive text-sm">{error}</p>}
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            className="cursor-pointer"
            onClick={onClose}
            disabled={saving}
          >
            {getMessage(messages, "decisions.cancel", "Cancel")}
          </Button>
          <Button
            className="cursor-pointer"
            onClick={handleSave}
            disabled={saving || !title.trim()}
          >
            {saving
              ? getMessage(messages, "decisions.saving", "Saving…")
              : getMessage(messages, "decisions.save", "Save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
