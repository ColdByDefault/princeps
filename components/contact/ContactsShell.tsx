/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ContactList } from "./ContactList";
import { ContactDialog } from "./ContactDialog";
import { useContactMutations } from "./logic/useContactMutations";
import type { ContactRecord, LabelOptionRecord } from "@/types/api";
import type { ContactFormData } from "./ContactForm";

type ContactsShellProps = {
  initialContacts: ContactRecord[];
  availableLabels: LabelOptionRecord[];
};

export function ContactsShell({
  initialContacts,
  availableLabels,
}: ContactsShellProps) {
  const t = useTranslations("contacts");

  const [contacts, setContacts] = useState<ContactRecord[]>(initialContacts);
  const [createOpen, setCreateOpen] = useState(false);
  const [editContact, setEditContact] = useState<ContactRecord | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const { creating, createContact, updateContact, deleteContact } =
    useContactMutations(setContacts, {
      createSuccess: t("createDialog.success"),
      createError: t("createDialog.error"),
      updateSuccess: t("editDialog.success"),
      updateError: t("editDialog.error"),
      deleteSuccess: t("deleteDialog.success"),
      deleteError: t("deleteDialog.error"),
    });

  function handleEdit(contact: ContactRecord) {
    setEditContact(contact);
    setEditOpen(true);
  }

  async function handleCreate(data: ContactFormData) {
    await createContact(data);
  }

  async function handleUpdate(data: ContactFormData) {
    if (!editContact) return;
    const ok = await updateContact(editContact.id, data);
    if (ok) setEditOpen(false);
  }

  async function handleDelete(contactId: string) {
    await deleteContact(contactId);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("pageTitle")}
        </h1>
        <Button
          onClick={() => setCreateOpen(true)}
          className="cursor-pointer"
          disabled={creating}
          aria-label={t("newContact")}
        >
          <Plus className="mr-2 size-4" />
          {t("newContact")}
        </Button>
      </div>

      <ContactList
        contacts={contacts}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Create dialog */}
      <ContactDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        availableLabels={availableLabels}
        onSubmit={handleCreate}
      />

      {/* Edit dialog */}
      <ContactDialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setEditContact(null);
        }}
        contact={editContact}
        availableLabels={availableLabels}
        onSubmit={handleUpdate}
      />
    </div>
  );
}
