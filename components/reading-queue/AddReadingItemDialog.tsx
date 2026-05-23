/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.4
 */

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AddReadingItemDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (url: string, title?: string) => void;
  isAdding: boolean;
};

export function AddReadingItemDialog({
  open,
  onOpenChange,
  onAdd,
  isAdding,
}: AddReadingItemDialogProps) {
  const t = useTranslations("readingQueue");
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    onAdd(url.trim(), title.trim() || undefined);
    setUrl("");
    setTitle("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("addDialog.title")}</DialogTitle>
          <DialogDescription>{t("addDialog.description")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rq-url">{t("fields.url")}</Label>
            <Input
              id="rq-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={t("fields.urlPlaceholder")}
              required
              aria-label={t("fields.url")}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rq-title">
              {t("fields.title")}{" "}
              <span className="text-xs text-muted-foreground">
                ({t("fields.titleOptional")})
              </span>
            </Label>
            <Input
              id="rq-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("fields.titlePlaceholder")}
              aria-label={t("fields.title")}
              maxLength={255}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="cursor-pointer"
            >
              {t("addDialog.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={isAdding || !url.trim()}
              className="cursor-pointer"
            >
              {isAdding ? t("addDialog.saving") : t("addDialog.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
