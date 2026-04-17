/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * SPDX-License-Identifier: Elastic-2.0
 */

"use client";

import { useState } from "react";
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
import { Label } from "@/components/ui/label";

type EditProfileDialogProps = {
  name: string | null;
  username: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: { name?: string; username?: string }) => Promise<boolean>;
  updating: boolean;
};

// Inner form — remounts each time the dialog opens (via key), ensuring clean state.
function EditForm({
  name,
  username,
  onClose,
  onSubmit,
  updating,
}: {
  name: string | null;
  username: string | null;
  onClose: () => void;
  onSubmit: (input: { name?: string; username?: string }) => Promise<boolean>;
  updating: boolean;
}) {
  const t = useTranslations("profile");

  const [draftName, setDraftName] = useState(name ?? "");
  const [draftUsername, setDraftUsername] = useState(username ?? "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const input: { name?: string; username?: string } = {};
    const trimmedName = draftName.trim();
    const trimmedUsername = draftUsername.trim();

    if (trimmedName && trimmedName !== (name ?? "")) {
      input.name = trimmedName;
    }
    if (trimmedUsername && trimmedUsername !== (username ?? "")) {
      input.username = trimmedUsername;
    }

    if (Object.keys(input).length === 0) {
      onClose();
      return;
    }

    const ok = await onSubmit(input);
    if (ok) {
      onClose();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="profile-name">{t("name")}</Label>
        <Input
          id="profile-name"
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          placeholder={t("editDialog.namePlaceholder")}
          minLength={2}
          maxLength={100}
          autoFocus
          aria-label={t("name")}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="profile-username">{t("username")}</Label>
        <Input
          id="profile-username"
          value={draftUsername}
          onChange={(e) => setDraftUsername(e.target.value)}
          placeholder={t("editDialog.usernamePlaceholder")}
          minLength={3}
          maxLength={30}
          aria-label={t("username")}
        />
        <p className="text-xs text-muted-foreground">
          {t("editDialog.usernameHint")}
        </p>
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="ghost"
          className="cursor-pointer"
          onClick={onClose}
          disabled={updating}
        >
          {t("editDialog.cancel")}
        </Button>
        <Button type="submit" className="cursor-pointer" disabled={updating}>
          {updating ? t("editDialog.submitting") : t("editDialog.submit")}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function EditProfileDialog({
  name,
  username,
  open,
  onOpenChange,
  onSubmit,
  updating,
}: EditProfileDialogProps) {
  const t = useTranslations("profile");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("editDialog.heading")}</DialogTitle>
        </DialogHeader>
        {open && (
          <EditForm
            key={`${name}|${username}`}
            name={name}
            username={username}
            onClose={() => onOpenChange(false)}
            onSubmit={onSubmit}
            updating={updating}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
