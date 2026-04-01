/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import { useState } from "react";
import { ContactList } from "@/components/contacts";
import { getMessage } from "@/lib/i18n";
import type { ContactRecord, LabelOptionRecord } from "@/types/api";
import type { MessageDictionary } from "@/types/i18n";

interface ContactsViewProps {
  messages: MessageDictionary;
  initialContacts: ContactRecord[];
  availableLabels?: LabelOptionRecord[];
}

export function ContactsView({
  messages,
  initialContacts,
  availableLabels = [],
}: ContactsViewProps) {
  const [contacts, setContacts] = useState<ContactRecord[]>(initialContacts);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        {getMessage(messages, "contacts.metadata.title", "Contacts")}
      </h1>
      <ContactList
        messages={messages}
        contacts={contacts}
        availableLabels={availableLabels}
        onContactsChange={setContacts}
      />
    </div>
  );
}
