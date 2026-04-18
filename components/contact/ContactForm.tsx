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

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { ContactRecord, LabelOptionRecord } from "@/types/api";

export type ContactFormData = {
  name: string;
  role: string;
  company: string;
  email: string;
  phone: string;
  notes: string;
  lastContact: string;
  labelIds: string[];
};

interface ContactFormProps {
  contact?: ContactRecord | null;
  onSubmit: (data: ContactFormData) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
  availableLabels: LabelOptionRecord[];
}

export function ContactForm({
  contact,
  onSubmit,
  onCancel,
  isSubmitting = false,
  availableLabels,
}: ContactFormProps) {
  const t = useTranslations("contacts");

  const [name, setName] = useState(contact?.name ?? "");
  const [role, setRole] = useState(contact?.role ?? "");
  const [company, setCompany] = useState(contact?.company ?? "");
  const [email, setEmail] = useState(contact?.email ?? "");
  const [phone, setPhone] = useState(contact?.phone ?? "");
  const [notes, setNotes] = useState(contact?.notes ?? "");
  const [lastContact, setLastContact] = useState(
    contact?.lastContact ? contact.lastContact.slice(0, 10) : "",
  );
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>(
    contact?.labels.map((l) => l.id) ?? [],
  );

  function toggleLabel(id: string) {
    setSelectedLabelIds((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    await onSubmit({
      name: name.trim(),
      role,
      company,
      email,
      phone,
      notes,
      lastContact,
      labelIds: selectedLabelIds,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="contact-name">
          {t("fields.name")}
          <span aria-hidden="true" className="ml-0.5 text-destructive">
            *
          </span>
        </Label>
        <Input
          id="contact-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("fields.namePlaceholder")}
          required
          autoFocus
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="contact-role">
            {t("fields.role")}
            <span className="ml-1 text-xs font-normal text-muted-foreground">
              ({t("fields.optional")})
            </span>
          </Label>
          <Input
            id="contact-role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder={t("fields.rolePlaceholder")}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="contact-company">
            {t("fields.company")}
            <span className="ml-1 text-xs font-normal text-muted-foreground">
              ({t("fields.optional")})
            </span>
          </Label>
          <Input
            id="contact-company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder={t("fields.companyPlaceholder")}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="contact-email">
            {t("fields.email")}
            <span className="ml-1 text-xs font-normal text-muted-foreground">
              ({t("fields.optional")})
            </span>
          </Label>
          <Input
            id="contact-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("fields.emailPlaceholder")}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="contact-phone">
            {t("fields.phone")}
            <span className="ml-1 text-xs font-normal text-muted-foreground">
              ({t("fields.optional")})
            </span>
          </Label>
          <Input
            id="contact-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={t("fields.phonePlaceholder")}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="contact-last">
          {t("fields.lastContact")}
          <span className="ml-1 text-xs font-normal text-muted-foreground">
            ({t("fields.optional")})
          </span>
        </Label>
        <Input
          id="contact-last"
          type="date"
          value={lastContact}
          onChange={(e) => setLastContact(e.target.value)}
          className="cursor-pointer"
          aria-label={t("fields.lastContact")}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="contact-notes">
          {t("fields.notes")}
          <span className="ml-1 text-xs font-normal text-muted-foreground">
            ({t("fields.optional")})
          </span>
        </Label>
        <Textarea
          id="contact-notes"
          value={notes}
          onChange={(e) => {
            if (e.target.value.length <= 250) setNotes(e.target.value);
          }}
          placeholder={t("fields.notesPlaceholder")}
          rows={3}
          className="resize-none"
          maxLength={250}
          aria-label={t("fields.notes")}
        />
        <p
          className={cn(
            "text-right text-xs",
            notes.length >= 230 ? "text-destructive" : "text-muted-foreground",
          )}
        >
          {notes.length}/250
        </p>
      </div>

      {availableLabels.length > 0 && (
        <div className="space-y-1.5">
          <Label>
            {t("fields.labels")}
            <span className="ml-1 text-xs font-normal text-muted-foreground">
              ({t("fields.optional")})
            </span>
          </Label>
          <div className="flex flex-wrap gap-1.5">
            {availableLabels.map((label) => {
              const selected = selectedLabelIds.includes(label.id);
              return (
                <button
                  key={label.id}
                  type="button"
                  onClick={() => toggleLabel(label.id)}
                  aria-label={label.name}
                  aria-pressed={selected}
                  className={cn(
                    "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
                    selected
                      ? "border-transparent text-white"
                      : "border-border bg-muted/40 text-muted-foreground hover:text-foreground",
                  )}
                  style={selected ? { backgroundColor: label.color } : {}}
                >
                  {label.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="cursor-pointer"
          >
            {t("deleteDialog.cancel")}
          </Button>
        )}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="cursor-pointer"
        >
          {isSubmitting
            ? contact
              ? t("editDialog.submitting")
              : t("createDialog.submitting")
            : contact
              ? t("editDialog.submit")
              : t("createDialog.submit")}
        </Button>
      </div>
    </form>
  );
}
