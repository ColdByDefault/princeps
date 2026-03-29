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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { getMessage } from "@/lib/i18n";
import type { ContactRecord } from "@/types/api";
import type { MessageDictionary } from "@/types/i18n";

interface ContactFormProps {
  messages: MessageDictionary;
  open: boolean;
  initial: ContactRecord | null;
  onClose: () => void;
  onSaved: (contact: ContactRecord) => void;
}

export function ContactForm({
  messages,
  open,
  initial,
  onClose,
  onSaved,
}: ContactFormProps) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      setRole(initial?.role ?? "");
      setCompany(initial?.company ?? "");
      setEmail(initial?.email ?? "");
      setPhone(initial?.phone ?? "");
      setNotes(initial?.notes ?? "");
      setTags(initial?.tags.join(", ") ?? "");
      setError(null);
    }
  }, [open, initial]);

  async function handleSave() {
    if (!name.trim()) return;
    setError(null);
    setSaving(true);

    const payload = {
      name: name.trim(),
      role: role.trim() || null,
      company: company.trim() || null,
      email: email.trim() || null,
      phone: phone.trim() || null,
      notes: notes.trim() || null,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    };

    try {
      const url = initial ? `/api/contacts/${initial.id}` : "/api/contacts";
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

      const data = (await res.json()) as { contact: ContactRecord };
      onSaved(data.contact);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : getMessage(
              messages,
              "contacts.saveError",
              "Failed to save contact. Please try again.",
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {initial
              ? initial.name
              : getMessage(messages, "contacts.add", "Add contact")}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="contact-name">
              {getMessage(messages, "contacts.field.name", "Name")}
            </Label>
            <Input
              id="contact-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={getMessage(
                messages,
                "contacts.field.name.placeholder",
                "Jane Doe",
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="contact-role">
                {getMessage(messages, "contacts.field.role", "Role")}
              </Label>
              <Input
                id="contact-role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder={getMessage(
                  messages,
                  "contacts.field.role.placeholder",
                  "VP of Engineering",
                )}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="contact-company">
                {getMessage(messages, "contacts.field.company", "Company")}
              </Label>
              <Input
                id="contact-company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder={getMessage(
                  messages,
                  "contacts.field.company.placeholder",
                  "Acme Corp",
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="contact-email">
                {getMessage(messages, "contacts.field.email", "Email")}
              </Label>
              <Input
                id="contact-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={getMessage(
                  messages,
                  "contacts.field.email.placeholder",
                  "jane@acme.com",
                )}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="contact-phone">
                {getMessage(messages, "contacts.field.phone", "Phone")}
              </Label>
              <Input
                id="contact-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={getMessage(
                  messages,
                  "contacts.field.phone.placeholder",
                  "+1 555 000 0000",
                )}
              />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="contact-tags">
              {getMessage(messages, "contacts.field.tags", "Tags")}
            </Label>
            <Input
              id="contact-tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder={getMessage(
                messages,
                "contacts.field.tags.placeholder",
                "investor, advisor, client",
              )}
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="contact-notes">
              {getMessage(messages, "contacts.field.notes", "Notes")}
            </Label>
            <Textarea
              id="contact-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={getMessage(
                messages,
                "contacts.field.notes.placeholder",
                "Context, history, key topics\u2026",
              )}
              rows={3}
            />
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            {getMessage(messages, "contacts.cancel", "Cancel")}
          </Button>
          <Button onClick={handleSave} disabled={saving || !name.trim()}>
            {saving
              ? getMessage(messages, "contacts.saving", "Saving\u2026")
              : getMessage(messages, "contacts.save", "Save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
