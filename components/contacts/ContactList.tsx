/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Pencil,
  Trash2,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared";
import { useNotice } from "@/components/shared";
import { getMessage } from "@/lib/i18n";
import { ContactForm } from "./ContactForm";
import type { ContactRecord, LabelOptionRecord } from "@/types/api";
import type { MessageDictionary } from "@/types/i18n";

interface Interaction {
  id: string;
  source: string;
  sourceId: string;
  createdAt: string;
}

interface ContactListProps {
  messages: MessageDictionary;
  contacts: ContactRecord[];
  availableLabels?: LabelOptionRecord[];
  onContactsChange: (contacts: ContactRecord[]) => void;
}

export function ContactList({
  messages,
  contacts,
  availableLabels = [],
  onContactsChange,
}: ContactListProps) {
  const { addNotice } = useNotice();
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ContactRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [interactionsLoading, setInteractionsLoading] = useState(false);

  async function toggleExpand(contactId: string) {
    if (expandedId === contactId) {
      setExpandedId(null);
      setInteractions([]);
      return;
    }
    setExpandedId(contactId);
    setInteractionsLoading(true);
    try {
      const res = await fetch(`/api/contacts/${contactId}/interactions`);
      if (res.ok) {
        const data = (await res.json()) as { interactions: Interaction[] };
        setInteractions(data.interactions);
      }
    } finally {
      setInteractionsLoading(false);
    }
  }

  function openCreate() {
    setEditTarget(null);
    setFormOpen(true);
  }

  function openEdit(contact: ContactRecord) {
    setEditTarget(contact);
    setFormOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const res = await fetch(`/api/contacts/${deleteTarget}`, {
      method: "DELETE",
    });
    if (res.ok) {
      onContactsChange(contacts.filter((c) => c.id !== deleteTarget));
      addNotice({
        type: "success",
        title: getMessage(
          messages,
          "contacts.deleteSuccess",
          "Contact deleted.",
        ),
      });
    } else {
      addNotice({
        type: "error",
        title: getMessage(
          messages,
          "contacts.deleteError",
          "Could not delete contact.",
        ),
      });
    }
    setDeleteTarget(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-sm">
          {contacts.length} {contacts.length === 1 ? "contact" : "contacts"}
        </span>
        <Button size="sm" onClick={openCreate}>
          <UserPlus className="mr-2 h-4 w-4" />
          {getMessage(messages, "contacts.add", "Add contact")}
        </Button>
      </div>

      {contacts.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm font-medium">
            {getMessage(messages, "contacts.empty", "No contacts yet.")}
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            {getMessage(
              messages,
              "contacts.emptyBody",
              "Add contacts to give the assistant context about who you work with.",
            )}
          </p>
        </div>
      ) : (
        <ul className="divide-y rounded-lg border">
          {contacts.map((contact) => (
            <li key={contact.id}>
              <div className="flex items-start justify-between gap-4 px-4 py-3">
                <button
                  className="flex min-w-0 flex-1 cursor-pointer items-start gap-2 text-left"
                  aria-label={getMessage(
                    messages,
                    "contacts.interactions.toggle",
                    "Toggle interaction history",
                  )}
                  onClick={() => toggleExpand(contact.id)}
                >
                  <span className="text-muted-foreground mt-1 shrink-0">
                    {expandedId === contact.id ? (
                      <ChevronDown className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {contact.name}
                    </p>
                    {(contact.role || contact.company) && (
                      <p className="text-muted-foreground truncate text-xs">
                        {[contact.role, contact.company]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    )}
                    {contact.tags.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {contact.tags.map((tag) => (
                          <span
                            key={tag}
                            className="bg-muted rounded px-1.5 py-0.5 text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </button>
                <div className="flex shrink-0 gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 cursor-pointer text-muted-foreground hover:text-foreground"
                    aria-label={getMessage(
                      messages,
                      "contacts.editLabel",
                      "Edit contact",
                    )}
                    onClick={() => openEdit(contact)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 cursor-pointer text-destructive hover:text-destructive"
                    aria-label={getMessage(
                      messages,
                      "contacts.deleteLabel",
                      "Delete contact",
                    )}
                    onClick={() => setDeleteTarget(contact.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {expandedId === contact.id && (
                <div className="bg-muted/30 border-t px-6 pb-3 pt-2">
                  <p className="text-muted-foreground mb-2 text-xs font-medium uppercase tracking-wide">
                    {getMessage(
                      messages,
                      "contacts.interactions.label",
                      "Interaction history",
                    )}
                  </p>
                  {interactionsLoading ? (
                    <p className="text-muted-foreground text-xs">
                      {getMessage(
                        messages,
                        "contacts.interactions.loading",
                        "Loading…",
                      )}
                    </p>
                  ) : interactions.length === 0 ? (
                    <p className="text-muted-foreground text-xs">
                      {getMessage(
                        messages,
                        "contacts.interactions.empty",
                        "No interactions recorded yet.",
                      )}
                    </p>
                  ) : (
                    <ul className="space-y-1">
                      {interactions.map((ix) => (
                        <li
                          key={ix.id}
                          className="flex items-center gap-2 text-xs"
                        >
                          <span className="bg-primary/10 text-primary rounded px-1.5 py-0.5 capitalize">
                            {getMessage(
                              messages,
                              `contacts.interactions.source.${ix.source}` as never,
                              ix.source,
                            )}
                          </span>
                          <span className="text-muted-foreground">
                            {new Date(ix.createdAt).toLocaleDateString()}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <ContactForm
        messages={messages}
        open={formOpen}
        initial={editTarget}
        availableLabels={availableLabels}
        onClose={() => setFormOpen(false)}
        onSaved={(contact) => {
          if (editTarget) {
            onContactsChange(
              contacts.map((c) => (c.id === contact.id ? contact : c)),
            );
          } else {
            onContactsChange(
              [...contacts, contact].sort((a, b) =>
                a.name.localeCompare(b.name),
              ),
            );
          }
          setFormOpen(false);
          addNotice({
            type: "success",
            title: getMessage(
              messages,
              editTarget ? "contacts.updateSuccess" : "contacts.createSuccess",
              editTarget ? "Contact updated." : "Contact added.",
            ),
          });
        }}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={getMessage(
          messages,
          "contacts.deleteTitle",
          "Delete this contact?",
        )}
        description={getMessage(
          messages,
          "contacts.deleteDescription",
          "This will permanently remove the contact.",
        )}
        confirmLabel={getMessage(messages, "contacts.deleteConfirm", "Delete")}
        cancelLabel={getMessage(messages, "contacts.cancel", "Cancel")}
        onConfirm={handleDelete}
      />
    </div>
  );
}
