/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getRequestConfig } from "@/i18n/request";
import { listContacts } from "@/lib/contacts/list.logic";
import { listLabels } from "@/lib/labels/list.logic";
import { ContactsView } from "./ContactsView";
import type { Metadata } from "next";
import { getMessage } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const { messages } = await getRequestConfig();
  return {
    title: getMessage(messages, "contacts.metadata.title", "Contacts"),
    description: getMessage(
      messages,
      "contacts.metadata.description",
      "Manage your professional contacts and relationships.",
    ),
  };
}

export default async function ContactsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const { messages } = await getRequestConfig();

  const rawContacts = await listContacts(session.user.id);
  const labels = await listLabels(session.user.id);

  const contacts = rawContacts.map((c) => ({
    ...c,
    lastContact: c.lastContact ? c.lastContact.toISOString() : null,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }));

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col px-6 py-8 sm:px-8 lg:px-10">
      <ContactsView
        messages={messages}
        initialContacts={contacts}
        availableLabels={labels}
      />
    </div>
  );
}
