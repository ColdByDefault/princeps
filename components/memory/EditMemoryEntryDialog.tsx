"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { MemoryEntryRecord } from "@/types/api";

type EditMemoryEntryDialogProps = {
  entry: MemoryEntryRecord | null;
  onClose: () => void;
  onSubmit: (
    id: string,
    input: { key?: string; value?: string },
  ) => Promise<boolean>;
  updating: string | null;
};

// Inner form — mounted fresh each time entry changes (via key prop on Dialog)
function EditForm({
  entry,
  onClose,
  onSubmit,
  updating,
}: {
  entry: MemoryEntryRecord;
  onClose: () => void;
  onSubmit: (
    id: string,
    input: { key?: string; value?: string },
  ) => Promise<boolean>;
  updating: string | null;
}) {
  const t = useTranslations("memory");
  const [key, setKey] = useState(entry.key);
  const [value, setValue] = useState(entry.value);
  const isUpdating = updating === entry.id;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ok = await onSubmit(entry.id, {
      key: key.trim(),
      value: value.trim(),
    });
    if (ok) onClose();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="edit-mem-key">{t("keyLabel")}</Label>
        <Input
          id="edit-mem-key"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder={t("keyPlaceholder")}
          maxLength={100}
          required
          aria-label={t("keyLabel")}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="edit-mem-value">{t("valueLabel")}</Label>
        <Textarea
          id="edit-mem-value"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={t("valuePlaceholder")}
          maxLength={2000}
          rows={3}
          required
          aria-label={t("valueLabel")}
        />
      </div>
      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          className="cursor-pointer"
          onClick={onClose}
        >
          {t("cancel")}
        </Button>
        <Button
          type="submit"
          className="cursor-pointer"
          disabled={isUpdating || !key.trim() || !value.trim()}
        >
          {isUpdating ? t("saving") : t("save")}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function EditMemoryEntryDialog({
  entry,
  onClose,
  onSubmit,
  updating,
}: EditMemoryEntryDialogProps) {
  const t = useTranslations("memory");

  return (
    <Dialog
      open={!!entry}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("editTitle")}</DialogTitle>
        </DialogHeader>
        {entry && (
          <EditForm
            key={entry.id}
            entry={entry}
            onClose={onClose}
            onSubmit={onSubmit}
            updating={updating}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
