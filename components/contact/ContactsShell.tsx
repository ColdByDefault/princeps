/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * SPDX-License-Identifier: Elastic-2.0
 */

"use client";

import { useState, useTransition } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ContactList } from "./ContactList";
import { CreateContactDialog } from "./CreateContactDialog";
import { EditContactDialog } from "./EditContactDialog";
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
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [isPendingRefresh, startRefresh] = useTransition();

  function handleRefresh() {
    startRefresh(async () => {
      const res = await fetch("/api/contacts");
      if (res.ok) {
        const { contacts: updated } = (await res.json()) as {
          contacts: ContactRecord[];
        };
        setContacts(updated);
      }
    });
  }

  const { creating, deleting, createContact, updateContact, deleteContact } =
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

  function handleDeleteRequest(contactId: string) {
    setDeleteTarget(contactId);
    setDeleteOpen(true);
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    await deleteContact(deleteTarget);
    setDeleteOpen(false);
    setDeleteTarget(null);
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("pageTitle")}
        </h1>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPendingRefresh}
            onClick={handleRefresh}
            aria-label={t("refresh")}
            className="cursor-pointer"
          >
            <RefreshCw
              className={`size-3.5 ${isPendingRefresh ? "animate-spin" : ""}`}
            />
            {isPendingRefresh ? t("refreshing") : t("refresh")}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => setCreateOpen(true)}
            className="cursor-pointer"
            disabled={creating}
            aria-label={t("newContact")}
          >
            <Plus className="size-4" />
            {t("newContact")}
          </Button>
        </div>
      </div>

      {/* Contact list */}
      {contacts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 px-6 py-16 text-center">
          <p className="text-sm text-muted-foreground">{t("empty")}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4 cursor-pointer"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="size-4" />
            {t("newContact")}
          </Button>
        </div>
      ) : (
        <ContactList
          contacts={contacts}
          isDeleting={deleting}
          onEdit={handleEdit}
          onDelete={handleDeleteRequest}
        />
      )}

      {/* Create dialog */}
      <CreateContactDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        availableLabels={availableLabels}
        onSubmit={handleCreate}
      />

      {/* Edit dialog */}
      {editContact && (
        <EditContactDialog
          open={editOpen}
          onOpenChange={(open) => {
            setEditOpen(open);
            if (!open) setEditContact(null);
          }}
          contact={editContact}
          availableLabels={availableLabels}
          onSubmit={handleUpdate}
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteDialog.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteDialog.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">
              {t("deleteDialog.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting !== null}
              className="cursor-pointer bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("deleteDialog.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
