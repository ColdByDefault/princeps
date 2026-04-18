/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version beta
 * @since beta
 * @module
 * @description
 */

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { ContactRecord, LabelOptionRecord } from "@/types/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ContactForm, type ContactFormData } from "./ContactForm";

interface EditContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: ContactRecord;
  availableLabels: LabelOptionRecord[];
  onSubmit: (data: ContactFormData) => Promise<void>;
}

export function EditContactDialog({
  open,
  onOpenChange,
  contact,
  availableLabels,
  onSubmit,
}: EditContactDialogProps) {
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
          <DialogTitle>{t("editDialog.heading")}</DialogTitle>
          <DialogDescription>{t("editDialog.description")}</DialogDescription>
        </DialogHeader>
        <ContactForm
          key={contact.id}
          contact={contact}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          isSubmitting={isSubmitting}
          availableLabels={availableLabels}
        />
      </DialogContent>
    </Dialog>
  );
}
