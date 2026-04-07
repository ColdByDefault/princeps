/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { LabelOptionRecord } from "@/types/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ContactForm, type ContactFormData } from "./ContactForm";

interface CreateContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableLabels: LabelOptionRecord[];
  onSubmit: (data: ContactFormData) => Promise<void>;
}

export function CreateContactDialog({
  open,
  onOpenChange,
  availableLabels,
  onSubmit,
}: CreateContactDialogProps) {
  const t = useTranslations("contacts");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(data: ContactFormData) {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("createDialog.heading")}</DialogTitle>
          <DialogDescription>{t("createDialog.description")}</DialogDescription>
        </DialogHeader>
        <ContactForm
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          isSubmitting={isSubmitting}
          availableLabels={availableLabels}
        />
      </DialogContent>
    </Dialog>
  );
}
