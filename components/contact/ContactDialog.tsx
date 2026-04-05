/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
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

interface ContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact?: ContactRecord | null;
  availableLabels: LabelOptionRecord[];
  onSubmit: (data: ContactFormData) => Promise<void>;
}

export function ContactDialog({
  open,
  onOpenChange,
  contact = null,
  availableLabels,
  onSubmit,
}: ContactDialogProps) {
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
          <DialogTitle>
            {contact ? t("editDialog.heading") : t("createDialog.heading")}
          </DialogTitle>
          <DialogDescription>
            {contact ? t("editDialog.heading") : t("createDialog.heading")}
          </DialogDescription>
        </DialogHeader>
        <ContactForm
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
