/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.4
 * @since beta
 */

import "server-only";

import { createContact } from "@/lib/features/contacts/create.logic";
import {
  listContacts,
  getContactById,
} from "@/lib/features/contacts/list.logic";
import { updateContact } from "@/lib/features/contacts/update.logic";
import { deleteContact } from "@/lib/features/contacts/delete.logic";
import { logContactInteraction } from "@/lib/features/contacts/log-interaction.logic";
import {
  createContactSchema,
  updateContactSchema,
  logInteractionSchema,
} from "@/lib/features/contacts/schemas";
import { resolveOrCreateLabelIdsByNames } from "@/lib/ai/tools/resolvers";
import { enforceContactsMax } from "@/lib/platform/tiers";
import type { ActionResult, ToolHandler } from "@/lib/ai/tools/types";

async function handleCreateContact(
  userId: string,
  args: Record<string, unknown>,
): Promise<ActionResult> {
  const labelNames = Array.isArray(args.labelNames)
    ? (args.labelNames as string[])
    : [];
  const labelIds = labelNames.length
    ? await resolveOrCreateLabelIdsByNames(userId, labelNames)
    : undefined;

  const parsed = createContactSchema.safeParse({ ...args, labelIds });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid create_contact input.",
    };
  }

  // Duplicate detection: check existing contacts for same name + company combo.
  const existing = await listContacts(userId);
  const normalizedNew = parsed.data.name.trim().toLowerCase();
  const duplicate = existing.find(
    (c) => c.name.trim().toLowerCase() === normalizedNew,
  );

  if (duplicate) {
    return {
      ok: false,
      error: `A contact named "${duplicate.name}" already exists (id: ${duplicate.id}). Suggest updating the existing contact instead, or confirm with the user that a new one is intended.`,
    };
  }

  // Tier gate — checked after duplicate detection so the LLM gets the more
  // actionable duplicate error first when both conditions apply.
  const gate = await enforceContactsMax(userId);
  if (!gate.allowed) {
    return {
      ok: false,
      error: gate.reason ?? "Contact limit reached for your plan.",
    };
  }

  const contact = await createContact(userId, parsed.data);
  return { ok: true, data: contact };
}

async function handleListContacts(
  userId: string,
  _args: Record<string, unknown>,
): Promise<ActionResult> {
  const contacts = await listContacts(userId);
  return { ok: true, data: contacts };
}

async function handleUpdateContact(
  userId: string,
  args: Record<string, unknown>,
): Promise<ActionResult> {
  if (typeof args.contactId !== "string") {
    return { ok: false, error: "update_contact requires contactId." };
  }

  const labelNames = Array.isArray(args.labelNames)
    ? (args.labelNames as string[])
    : undefined;
  const labelIds =
    labelNames !== undefined
      ? await resolveOrCreateLabelIdsByNames(userId, labelNames)
      : undefined;

  const { contactId, ...rest } = args;
  const parsed = updateContactSchema.safeParse({
    ...rest,
    ...(labelIds !== undefined ? { labelIds } : {}),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid update_contact input.",
    };
  }

  const result = await updateContact(contactId as string, userId, parsed.data);
  if (!result.ok) {
    return { ok: false, error: "Contact not found." };
  }
  return { ok: true, data: result.contact };
}

async function handleDeleteContact(
  userId: string,
  args: Record<string, unknown>,
): Promise<ActionResult> {
  if (typeof args.contactId !== "string") {
    return { ok: false, error: "delete_contact requires contactId." };
  }

  // Verify ownership before deleting so the LLM gets a clear error if missing.
  const contact = await getContactById(userId, args.contactId);
  if (!contact) {
    return { ok: false, error: "Contact not found." };
  }

  const result = await deleteContact(args.contactId, userId);
  if (!result.ok) {
    return { ok: false, error: "Contact not found." };
  }
  return { ok: true, data: { deleted: true, name: contact.name } };
}

async function handleLogContactInteraction(
  userId: string,
  args: Record<string, unknown>,
): Promise<ActionResult> {
  // Resolve contactId from name if not provided directly
  let contactId = typeof args.contactId === "string" ? args.contactId : null;

  if (!contactId && typeof args.contactName === "string") {
    const all = await listContacts(userId);
    const normalized = args.contactName.trim().toLowerCase();
    const found = all.find((c) => c.name.trim().toLowerCase() === normalized);
    if (!found) {
      return {
        ok: false,
        error: `No contact found with name "${args.contactName}". Create the contact first or provide the contactId.`,
      };
    }
    contactId = found.id;
  }

  if (!contactId) {
    return {
      ok: false,
      error: "log_contact_interaction requires contactId or contactName.",
    };
  }

  const parsed = logInteractionSchema.safeParse(args);
  if (!parsed.success) {
    return {
      ok: false,
      error:
        parsed.error.issues[0]?.message ??
        "Invalid log_contact_interaction input.",
    };
  }

  return logContactInteraction(userId, contactId, parsed.data);
}

export const contactHandlers: Record<string, ToolHandler> = {
  create_contact: handleCreateContact,
  list_contacts: handleListContacts,
  update_contact: handleUpdateContact,
  delete_contact: handleDeleteContact,
  log_contact_interaction: handleLogContactInteraction,
};
