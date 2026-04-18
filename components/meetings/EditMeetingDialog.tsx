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

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { UserPlus, X, CheckSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  LabelOptionRecord,
  MeetingRecord,
  ContactRecord,
  TaskRecord,
} from "@/types/api";
import { DateTimePicker } from "@/components/ui/date-time-picker";

type EditMeetingDialogProps = {
  meeting: MeetingRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (
    meetingId: string,
    input: Partial<{
      title: string;
      scheduledAt: string;
      durationMin: number | null;
      location: string | null;
      status: string;
      kind: string;
      agenda: string | null;
      labelIds: string[];
      participantContactIds: string[];
      linkedTaskIds: string[];
      pushToGoogle: boolean;
    }>,
  ) => Promise<boolean>;
  updating: boolean;
  availableLabels: LabelOptionRecord[];
  availableContacts: ContactRecord[];
  availableTasks: TaskRecord[];
  hasGoogleCalendar?: boolean;
};

function toDatetimeLocal(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EditMeetingDialog({
  meeting,
  open,
  onOpenChange,
  onSubmit,
  updating,
  availableLabels,
  availableContacts,
  availableTasks,
  hasGoogleCalendar = false,
}: EditMeetingDialogProps) {
  const t = useTranslations("meetings");
  const [title, setTitle] = useState(meeting?.title ?? "");
  const [scheduledAt, setScheduledAt] = useState(
    meeting ? toDatetimeLocal(meeting.scheduledAt) : "",
  );
  const [durationMin, setDurationMin] = useState(
    meeting?.durationMin != null ? String(meeting.durationMin) : "",
  );
  const [location, setLocation] = useState(meeting?.location ?? "");
  const [status, setStatus] = useState(meeting?.status ?? "upcoming");
  const [kind, setKind] = useState(meeting?.kind ?? "meeting");
  const [agenda, setAgenda] = useState(meeting?.agenda ?? "");
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<
    string[]
  >(meeting?.participants.map((p) => p.contactId) ?? []);

  // Fallback name map from participant data — covers contacts created during sync
  // that aren't yet in availableContacts (loaded at page render time).
  const participantNameFallback = useMemo(() => {
    const map = new Map<string, string>();
    meeting?.participants.forEach((p) => map.set(p.contactId, p.contactName));
    return map;
  }, [meeting]);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>(
    meeting?.tasks.map((t) => t.id) ?? [],
  );
  const [contacts, setContacts] = useState<ContactRecord[]>(availableContacts);
  const [qcOpen, setQcOpen] = useState(false);
  const [qcName, setQcName] = useState("");
  const [qcCompany, setQcCompany] = useState("");
  const [qcEmail, setQcEmail] = useState("");
  const [qcSubmitting, setQcSubmitting] = useState(false);
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>(
    meeting?.labels.map((l) => l.id) ?? [],
  );
  const [pushToGoogle, setPushToGoogle] = useState(false);

  function toggleLabel(id: string) {
    setSelectedLabelIds((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!meeting || !title.trim() || !scheduledAt) return;

    const ok = await onSubmit(meeting.id, {
      title: title.trim(),
      scheduledAt: new Date(scheduledAt).toISOString(),
      durationMin: durationMin ? parseInt(durationMin, 10) : null,
      location: location.trim() || null,
      status,
      kind,
      agenda: agenda.trim() || null,
      participantContactIds: selectedParticipantIds,
      linkedTaskIds: selectedTaskIds,
      labelIds: selectedLabelIds,
      ...(hasGoogleCalendar && pushToGoogle && !meeting.googleEventId
        ? { pushToGoogle: true }
        : {}),
    });

    if (ok) onOpenChange(false);
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
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("editDialog.heading")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-meeting-title">{t("fields.title")}</Label>
              <Input
                id="edit-meeting-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("fields.titlePlaceholder")}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-meeting-scheduled-at">
                {t("fields.scheduledAt")}
              </Label>
              <DateTimePicker
                value={scheduledAt}
                onChange={setScheduledAt}
                placeholder={t("fields.scheduledAtPlaceholder")}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit-meeting-duration">
                  {t("fields.durationMin")}
                </Label>
                <Input
                  id="edit-meeting-duration"
                  type="number"
                  min={1}
                  max={1440}
                  value={durationMin}
                  onChange={(e) => setDurationMin(e.target.value)}
                  placeholder={t("fields.durationPlaceholder")}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-meeting-status">
                  {t("fields.status")}
                </Label>
                <Select
                  value={status}
                  onValueChange={(v) => {
                    if (v) setStatus(v);
                  }}
                >
                  <SelectTrigger
                    id="edit-meeting-status"
                    className="cursor-pointer"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upcoming">
                      {t("status.upcoming")}
                    </SelectItem>
                    <SelectItem value="done">{t("status.done")}</SelectItem>
                    <SelectItem value="cancelled">
                      {t("status.cancelled")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-meeting-kind">{t("fields.kind")}</Label>
                <Select
                  value={kind}
                  onValueChange={(v) => {
                    if (v) setKind(v);
                  }}
                >
                  <SelectTrigger
                    id="edit-meeting-kind"
                    className="cursor-pointer"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="meeting">{t("kind.meeting")}</SelectItem>
                    <SelectItem value="appointment">
                      {t("kind.appointment")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-meeting-location">
                {t("fields.location")}
              </Label>
              <Input
                id="edit-meeting-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={t("fields.locationPlaceholder")}
              />
            </div>

            {/* Participants */}
            <div className="space-y-1.5">
              <Label>{t("fields.participants")}</Label>
              {selectedParticipantIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-1.5">
                  {selectedParticipantIds.map((cid) => {
                    const c = contacts.find((x) => x.id === cid);
                    const displayName =
                      c?.name ?? participantNameFallback.get(cid) ?? cid;
                    return (
                      <span
                        key={cid}
                        className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium"
                      >
                        {displayName}
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
                    id="edit-meeting-participants"
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

            {/* Linked tasks */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <CheckSquare className="size-3.5" />
                {t("fields.linkedTasks")}
              </Label>
              {selectedTaskIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-1.5">
                  {selectedTaskIds.map((tid) => {
                    const task =
                      availableTasks.find((x) => x.id === tid) ??
                      meeting?.tasks.find((x) => x.id === tid);
                    return (
                      <span
                        key={tid}
                        className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium"
                      >
                        {task?.title ?? tid}
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedTaskIds((prev) =>
                              prev.filter((id) => id !== tid),
                            )
                          }
                          className="cursor-pointer text-muted-foreground hover:text-foreground"
                          aria-label={t("fields.removeTask")}
                        >
                          <X className="size-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
              <Select
                value=""
                onValueChange={(tid) => {
                  if (tid && !selectedTaskIds.includes(tid)) {
                    setSelectedTaskIds((prev) => [...prev, tid]);
                  }
                }}
              >
                <SelectTrigger
                  id="edit-meeting-tasks"
                  className="cursor-pointer"
                  aria-label={t("fields.addTask")}
                >
                  <SelectValue placeholder={t("fields.addTask")} />
                </SelectTrigger>
                <SelectContent>
                  {availableTasks
                    .filter(
                      (task) =>
                        !selectedTaskIds.includes(task.id) &&
                        (task.meetingId === null ||
                          task.meetingId === meeting?.id),
                    )
                    .map((task) => (
                      <SelectItem key={task.id} value={task.id}>
                        {task.title}
                      </SelectItem>
                    ))}
                  {availableTasks.filter(
                    (task) =>
                      !selectedTaskIds.includes(task.id) &&
                      (task.meetingId === null ||
                        task.meetingId === meeting?.id),
                  ).length === 0 && (
                    <div className="px-2 py-1.5 text-xs text-muted-foreground">
                      {t("fields.noMoreTasks")}
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-meeting-agenda">{t("fields.agenda")}</Label>
              <Textarea
                id="edit-meeting-agenda"
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

            {hasGoogleCalendar && !meeting?.googleEventId && (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="edit-meeting-push-to-google"
                  checked={pushToGoogle}
                  onCheckedChange={(v) => setPushToGoogle(v === true)}
                  aria-label={t("editDialog.syncGoogle")}
                />
                <label
                  htmlFor="edit-meeting-push-to-google"
                  className="cursor-pointer select-none text-sm"
                >
                  {t("editDialog.syncGoogle")}
                </label>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="cursor-pointer"
              >
                {t("editDialog.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={updating || !title.trim() || !scheduledAt}
                className="cursor-pointer"
              >
                {updating ? t("editDialog.submitting") : t("editDialog.submit")}
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
              <Label htmlFor="qc-name">{t("quickContact.name")}</Label>
              <Input
                id="qc-name"
                value={qcName}
                onChange={(e) => setQcName(e.target.value)}
                placeholder={t("quickContact.namePlaceholder")}
                required
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="qc-company">{t("quickContact.company")}</Label>
              <Input
                id="qc-company"
                value={qcCompany}
                onChange={(e) => setQcCompany(e.target.value)}
                placeholder={t("quickContact.companyPlaceholder")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="qc-email">{t("quickContact.email")}</Label>
              <Input
                id="qc-email"
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
