/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * SPDX-License-Identifier: Elastic-2.0
 */

import { useState } from "react";
import { toast } from "sonner";
import type { ContactRecord } from "@/types/api";
import type { ContactFormData } from "../ContactForm";

type Translations = {
  createSuccess: string;
  createError: string;
  updateSuccess: string;
  updateError: string;
  deleteSuccess: string;
  deleteError: string;
};

export function useContactMutations(
  setContacts: React.Dispatch<React.SetStateAction<ContactRecord[]>>,
  t: Translations,
) {
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function createContact(data: ContactFormData): Promise<boolean> {
    setCreating(true);
    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          role: data.role || null,
          company: data.company || null,
          email: data.email || null,
          phone: data.phone || null,
          notes: data.notes || null,
          lastContact: data.lastContact
            ? new Date(data.lastContact).toISOString()
            : null,
          labelIds: data.labelIds,
        }),
      });
      if (!res.ok) throw new Error();
      const json = (await res.json()) as { contact: ContactRecord };
      setContacts((prev) => [json.contact, ...prev]);
      toast.success(t.createSuccess);
      return true;
    } catch {
      toast.error(t.createError);
      return false;
    } finally {
      setCreating(false);
    }
  }

  async function updateContact(
    contactId: string,
    data: ContactFormData,
  ): Promise<boolean> {
    setUpdating(contactId);
    try {
      const res = await fetch(`/api/contacts/${contactId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          role: data.role || null,
          company: data.company || null,
          email: data.email || null,
          phone: data.phone || null,
          notes: data.notes || null,
          lastContact: data.lastContact
            ? new Date(data.lastContact).toISOString()
            : null,
          labelIds: data.labelIds,
        }),
      });
      if (!res.ok) throw new Error();
      const json = (await res.json()) as { contact: ContactRecord };
      setContacts((prev) =>
        prev.map((c) => (c.id === contactId ? json.contact : c)),
      );
      toast.success(t.updateSuccess);
      return true;
    } catch {
      toast.error(t.updateError);
      return false;
    } finally {
      setUpdating(null);
    }
  }

  async function deleteContact(contactId: string): Promise<boolean> {
    setDeleting(contactId);
    try {
      const res = await fetch(`/api/contacts/${contactId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      setContacts((prev) => prev.filter((c) => c.id !== contactId));
      toast.success(t.deleteSuccess);
      return true;
    } catch {
      toast.error(t.deleteError);
      return false;
    } finally {
      setDeleting(null);
    }
  }

  return {
    creating,
    updating,
    deleting,
    createContact,
    updateContact,
    deleteContact,
  };
}
