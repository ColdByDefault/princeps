/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { UserPlus, X } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { LabelOptionRecord, ContactRecord } from "@/types/api";
import { cn } from "@/lib/utils";

type CreateMeetingDialogProps = {
  onSubmit: (input: {
    title: string;
    scheduledAt: string;
    durationMin?: number | null;
    location?: string | null;
    agenda?: string | null;
    labelIds?: string[];
    participantContactIds?: string[];
  }) => Promise<boolean>;
  creating: boolean;
  availableLabels: LabelOptionRecord[];
  availableContacts: ContactRecord[];
  children: React.ReactNode;
};

export function CreateMeetingDialog({
  onSubmit,
  creating,
  availableLabels,
  availableContacts,
  children,
}: CreateMeetingDialogProps) {
  const t = useTranslations("meetings");
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [durationMin, setDurationMin] = useState("");
  const [location, setLocation] = useState("");
  const [agenda, setAgenda] = useState("");
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);
  const [contacts, setContacts] = useState<ContactRecord[]>(availableContacts);
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<
    string[]
  >([]);
  const [qcOpen, setQcOpen] = useState(false);
  const [qcName, setQcName] = useState("");
  const [qcCompany, setQcCompany] = useState("");
  const [qcEmail, setQcEmail] = useState("");
  const [qcSubmitting, setQcSubmitting] = useState(false);

  function toggleLabel(id: string) {
    setSelectedLabelIds((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id],
    );
  }

  function resetForm() {
    setTitle("");
    setScheduledAt("");
    setDurationMin("");
    setLocation("");
    setAgenda("");
    setSelectedLabelIds([]);
    setSelectedParticipantIds([]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !scheduledAt) return;

    const ok = await onSubmit({
      title: title.trim(),
      scheduledAt: new Date(scheduledAt).toISOString(),
      durationMin: durationMin ? parseInt(durationMin, 10) : null,
      location: location.trim() || null,
      agenda: agenda.trim() || null,
      ...(selectedLabelIds.length && { labelIds: selectedLabelIds }),
      ...(selectedParticipantIds.length && {
        participantContactIds: selectedParticipantIds,
      }),
    });

    if (ok) {
      setOpen(false);
      resetForm();
    }
  }

  async function handleQuickCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!qcName.trim()) return;
    setQcSubmitting(true);
    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: qcName.trim(),
          company: qcCompany.trim() || null,
          email: qcEmail.trim() || null,
        }),
      });
      if (!res.ok) return;
      const data = (await res.json()) as { contact: ContactRecord };
      setContacts((prev) => [data.contact, ...prev]);
      setSelectedParticipantIds((prev) => [...prev, data.contact.id]);
      setQcOpen(false);
      setQcName("");
      setQcCompany("");
      setQcEmail("");
    } finally {
      setQcSubmitting(false);
    }
  }

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) resetForm();
        }}
      >
        <DialogTrigger render={children as React.ReactElement} />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("createDialog.heading")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="meeting-title">
                {t("fields.title")}
                <span aria-hidden="true" className="ml-0.5 text-destructive">
                  *
                </span>
              </Label>
              <Input
                id="meeting-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("fields.titlePlaceholder")}
                required
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="meeting-scheduled-at">
                {t("fields.scheduledAt")}
                <span aria-hidden="true" className="ml-0.5 text-destructive">
                  *
                </span>
              </Label>
              <Input
                id="meeting-scheduled-at"
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="meeting-duration">
                  {t("fields.durationMin")}
                  <span className="ml-1 text-xs font-normal text-muted-foreground">
                    ({t("fields.optional")})
                  </span>
                </Label>
                <Input
                  id="meeting-duration"
                  type="number"
                  min={1}
                  max={1440}
                  value={durationMin}
                  onChange={(e) => setDurationMin(e.target.value)}
                  placeholder={t("fields.durationPlaceholder")}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="meeting-location">
                  {t("fields.location")}
                  <span className="ml-1 text-xs font-normal text-muted-foreground">
                    ({t("fields.optional")})
                  </span>
                </Label>
                <Input
                  id="meeting-location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder={t("fields.locationPlaceholder")}
                />
              </div>
            </div>

            {/* Participants */}
            <div className="space-y-1.5">
              <Label>{t("fields.participants")}</Label>
              {selectedParticipantIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-1.5">
                  {selectedParticipantIds.map((cid) => {
                    const c = contacts.find((x) => x.id === cid);
                    return (
                      <span
                        key={cid}
                        className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium"
                      >
                        {c?.name ?? cid}
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedParticipantIds((prev) =>
                              prev.filter((id) => id !== cid),
                            )
                          }
                          className="cursor-pointer text-muted-foreground hover:text-foreground"
                          aria-label={t("fields.removeParticipant")}
                        >
                          <X className="size-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
              <div className="flex items-center gap-2">
                <Select
                  value=""
                  onValueChange={(cid) => {
                    if (cid && !selectedParticipantIds.includes(cid)) {
                      setSelectedParticipantIds((prev) => [...prev, cid]);
                    }
                  }}
                >
                  <SelectTrigger
                    id="meeting-participants"
                    className="cursor-pointer flex-1"
                    aria-label={t("fields.addParticipant")}
                  >
                    <SelectValue placeholder={t("fields.addParticipant")} />
                  </SelectTrigger>
                  <SelectContent>
                    {contacts
                      .filter((c) => !selectedParticipantIds.includes(c.id))
                      .map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                          {c.company ? ` — ${c.company}` : ""}
                        </SelectItem>
                      ))}
                    {contacts.filter(
                      (c) => !selectedParticipantIds.includes(c.id),
                    ).length === 0 && (
                      <div className="px-2 py-1.5 text-xs text-muted-foreground">
                        {t("fields.noMoreContacts")}
                      </div>
                    )}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="cursor-pointer shrink-0"
                  aria-label={t("fields.newContact")}
                  onClick={() => setQcOpen(true)}
                >
                  <UserPlus className="size-3.5 mr-1" />
                  {t("fields.newContact")}
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="meeting-agenda">{t("fields.agenda")}</Label>
              <Textarea
                id="meeting-agenda"
                value={agenda}
                onChange={(e) => {
                  if (e.target.value.length <= 300) setAgenda(e.target.value);
                }}
                placeholder={t("fields.agendaPlaceholder")}
                rows={3}
                className="resize-none"
                maxLength={300}
              />
              <p
                className={cn(
                  "text-right text-xs",
                  agenda.length >= 280
                    ? "text-destructive"
                    : "text-muted-foreground",
                )}
              >
                {agenda.length}/300
              </p>
            </div>

            {availableLabels.length > 0 && (
              <div className="space-y-1.5">
                <Label>{t("fields.labels")}</Label>
                <div className="flex flex-wrap gap-1.5">
                  {availableLabels.map((lbl) => (
                    <button
                      key={lbl.id}
                      type="button"
                      onClick={() => toggleLabel(lbl.id)}
                      className={`cursor-pointer rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors ${
                        selectedLabelIds.includes(lbl.id)
                          ? "border-transparent text-white"
                          : "border-border bg-background text-muted-foreground hover:bg-muted"
                      }`}
                      style={
                        selectedLabelIds.includes(lbl.id)
                          ? { backgroundColor: lbl.color }
                          : undefined
                      }
                      aria-pressed={selectedLabelIds.includes(lbl.id)}
                      aria-label={lbl.name}
                    >
                      {lbl.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setOpen(false);
                  resetForm();
                }}
                className="cursor-pointer"
              >
                {t("createDialog.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={creating || !title.trim() || !scheduledAt}
                className="cursor-pointer"
              >
                {creating
                  ? t("createDialog.submitting")
                  : t("createDialog.submit")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Quick-create contact nested dialog */}
      <Dialog open={qcOpen} onOpenChange={setQcOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("quickContact.heading")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleQuickCreate} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="create-qc-name">{t("quickContact.name")}</Label>
              <Input
                id="create-qc-name"
                value={qcName}
                onChange={(e) => setQcName(e.target.value)}
                placeholder={t("quickContact.namePlaceholder")}
                required
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-qc-company">
                {t("quickContact.company")}
              </Label>
              <Input
                id="create-qc-company"
                value={qcCompany}
                onChange={(e) => setQcCompany(e.target.value)}
                placeholder={t("quickContact.companyPlaceholder")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-qc-email">{t("quickContact.email")}</Label>
              <Input
                id="create-qc-email"
                type="email"
                value={qcEmail}
                onChange={(e) => setQcEmail(e.target.value)}
                placeholder={t("quickContact.emailPlaceholder")}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setQcOpen(false)}
                className="cursor-pointer"
              >
                {t("quickContact.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={qcSubmitting || !qcName.trim()}
                className="cursor-pointer"
              >
                {qcSubmitting
                  ? t("quickContact.submitting")
                  : t("quickContact.submit")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
