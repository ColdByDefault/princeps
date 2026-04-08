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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type CreateMemoryEntryDialogProps = {
  onSubmit: (input: { key: string; value: string }) => Promise<boolean>;
  creating: boolean;
  children: React.ReactNode;
};

export function CreateMemoryEntryDialog({
  onSubmit,
  creating,
  children,
}: CreateMemoryEntryDialogProps) {
  const t = useTranslations("memory");
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ok = await onSubmit({ key: key.trim(), value: value.trim() });
    if (ok) {
      setKey("");
      setValue("");
      setOpen(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={children as React.ReactElement} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("createTitle")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="mem-key">{t("keyLabel")}</Label>
            <Input
              id="mem-key"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder={t("keyPlaceholder")}
              maxLength={100}
              required
              aria-label={t("keyLabel")}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mem-value">{t("valueLabel")}</Label>
            <Textarea
              id="mem-value"
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
              onClick={() => setOpen(false)}
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              className="cursor-pointer"
              disabled={creating || !key.trim() || !value.trim()}
            >
              {creating ? t("saving") : t("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
