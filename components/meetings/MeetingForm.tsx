/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getMessage } from "@/lib/i18n";
import type { ContactRecord, MeetingRecord } from "@/types/api";
import type { MessageDictionary } from "@/types/i18n";

interface MeetingFormProps {
  messages: MessageDictionary;
  open: boolean;
  initial: MeetingRecord | null;
  contacts: ContactRecord[];
  onClose: () => void;
  onSaved: (meeting: MeetingRecord) => void;
}

function toLocalDatetimeValue(iso: string | null | undefined): string {
  if (!iso) return "";
  // datetime-local expects "YYYY-MM-DDTHH:MM"
  return iso.slice(0, 16);
}

export function MeetingForm({
  messages,
  open,
  initial,
  contacts,
  onClose,
  onSaved,
}: MeetingFormProps) {
  const [title, setTitle] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [durationMin, setDurationMin] = useState("");
  const [location, setLocation] = useState("");
  const [agenda, setAgenda] = useState("");
  const [summary, setSummary] = useState("");
  const [status, setStatus] = useState<string>("upcoming");
  const [participantIds, setParticipantIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setTitle(initial?.title ?? "");
      setScheduledAt(toLocalDatetimeValue(initial?.scheduledAt));
      setDurationMin(
        initial?.durationMin != null ? String(initial.durationMin) : "",
      );
      setLocation(initial?.location ?? "");
      setAgenda(initial?.agenda ?? "");
      setSummary(initial?.summary ?? "");
      setStatus(initial?.status ?? "upcoming");
      setParticipantIds(initial?.participants.map((p) => p.contactId) ?? []);
      setError(null);
    }
  }, [open, initial]);

  function toggleParticipant(contactId: string) {
    setParticipantIds((prev) =>
      prev.includes(contactId)
        ? prev.filter((id) => id !== contactId)
        : [...prev, contactId],
    );
  }

  async function handleSave() {
    if (!title.trim() || !scheduledAt) return;
    setError(null);
    setSaving(true);

    const payload = {
      title: title.trim(),
      scheduledAt: new Date(scheduledAt).toISOString(),
      durationMin: durationMin ? parseInt(durationMin, 10) : null,
      location: location.trim() || null,
      agenda: agenda.trim() || null,
      summary: summary.trim() || null,
      status,
      participantContactIds: participantIds,
    };

    try {
      const url = initial ? `/api/meetings/${initial.id}` : "/api/meetings";
      const method = initial ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to save.");
      }

      const data = (await res.json()) as { meeting: MeetingRecord };
      onSaved(data.meeting);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : getMessage(
              messages,
              "meetings.saveError",
              "Failed to save meeting. Please try again.",
            ),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initial
              ? initial.title
              : getMessage(messages, "meetings.add", "Add meeting")}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-3">
          {/* Title */}
          <div className="grid gap-1.5">
            <Label htmlFor="meeting-title">
              {getMessage(messages, "meetings.field.title", "Title")}
            </Label>
            <Input
              id="meeting-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={getMessage(
                messages,
                "meetings.field.title.placeholder",
                "Quarterly review",
              )}
            />
          </div>

          {/* Date/time + Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="meeting-scheduled-at">
                {getMessage(
                  messages,
                  "meetings.field.scheduledAt",
                  "Date & time",
                )}
              </Label>
              <Input
                id="meeting-scheduled-at"
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="meeting-duration">
                {getMessage(
                  messages,
                  "meetings.field.durationMin",
                  "Duration (min)",
                )}
              </Label>
              <Input
                id="meeting-duration"
                type="number"
                min={1}
                value={durationMin}
                onChange={(e) => setDurationMin(e.target.value)}
                placeholder={getMessage(
                  messages,
                  "meetings.field.durationMin.placeholder",
                  "60",
                )}
              />
            </div>
          </div>

          {/* Location */}
          <div className="grid gap-1.5">
            <Label htmlFor="meeting-location">
              {getMessage(messages, "meetings.field.location", "Location")}
            </Label>
            <Input
              id="meeting-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={getMessage(
                messages,
                "meetings.field.location.placeholder",
                "Zoom / Room 4B",
              )}
            />
          </div>

          {/* Status */}
          <div className="grid gap-1.5">
            <Label htmlFor="meeting-status">
              {getMessage(messages, "meetings.field.status", "Status")}
            </Label>
            <Select
              value={status}
              onValueChange={(v) => {
                if (v) setStatus(v);
              }}
            >
              <SelectTrigger id="meeting-status" className="cursor-pointer">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="upcoming" className="cursor-pointer">
                  {getMessage(messages, "meetings.status.upcoming", "Upcoming")}
                </SelectItem>
                <SelectItem value="done" className="cursor-pointer">
                  {getMessage(messages, "meetings.status.done", "Done")}
                </SelectItem>
                <SelectItem value="cancelled" className="cursor-pointer">
                  {getMessage(
                    messages,
                    "meetings.status.cancelled",
                    "Cancelled",
                  )}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Agenda */}
          <div className="grid gap-1.5">
            <Label htmlFor="meeting-agenda">
              {getMessage(messages, "meetings.field.agenda", "Agenda")}
            </Label>
            <Textarea
              id="meeting-agenda"
              rows={3}
              value={agenda}
              onChange={(e) => setAgenda(e.target.value)}
              placeholder={getMessage(
                messages,
                "meetings.field.agenda.placeholder",
                "Topics to cover\u2026",
              )}
            />
          </div>

          {/* Summary */}
          <div className="grid gap-1.5">
            <Label htmlFor="meeting-summary">
              {getMessage(messages, "meetings.field.summary", "Summary")}
            </Label>
            <Textarea
              id="meeting-summary"
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder={getMessage(
                messages,
                "meetings.field.summary.placeholder",
                "Key decisions and outcomes\u2026",
              )}
            />
          </div>

          {/* Participants */}
          {contacts.length > 0 && (
            <div className="grid gap-1.5">
              <Label>
                {getMessage(
                  messages,
                  "meetings.field.participants",
                  "Participants",
                )}
              </Label>
              <div className="max-h-40 overflow-y-auto rounded-md border p-2 space-y-1.5">
                {contacts.map((contact) => (
                  <div key={contact.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`participant-${contact.id}`}
                      checked={participantIds.includes(contact.id)}
                      onCheckedChange={() => toggleParticipant(contact.id)}
                    />
                    <label
                      htmlFor={`participant-${contact.id}`}
                      className="text-sm cursor-pointer"
                    >
                      {contact.name}
                      {contact.role && (
                        <span className="text-muted-foreground ml-1">
                          · {contact.role}
                        </span>
                      )}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && <p className="text-destructive text-sm">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            {getMessage(messages, "meetings.cancel", "Cancel")}
          </Button>
          <Button
            onClick={() => void handleSave()}
            disabled={saving || !title.trim() || !scheduledAt}
          >
            {saving
              ? getMessage(messages, "meetings.saving", "Saving\u2026")
              : getMessage(messages, "meetings.save", "Save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
