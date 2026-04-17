/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * SPDX-License-Identifier: Elastic-2.0
 */

"use client";

import { Users } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ContactRecord } from "@/types/api";
import { ContactCard } from "./ContactCard";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";

interface ContactListProps {
  contacts: ContactRecord[];
  isLoading?: boolean;
  isDeleting?: string | null;
  onEdit: (contact: ContactRecord) => void;
  onDelete: (contactId: string) => void;
}

export function ContactList({
  contacts,
  isLoading,
  isDeleting,
  onEdit,
  onDelete,
}: ContactListProps) {
  const t = useTranslations("contacts");

  if (isLoading) {
    return (
      <div className="divide-y rounded-xl border">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3">
            <Skeleton className="size-9 rounded-full shrink-0" />
            <div className="w-48 shrink-0 flex flex-col gap-1.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="hidden sm:block h-4 flex-1" />
            <Skeleton className="hidden lg:block h-4 w-28" />
          </div>
        ))}
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Users />
          </EmptyMedia>
          <EmptyTitle>{t("empty")}</EmptyTitle>
          <EmptyDescription>{t("newContact")}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="divide-y rounded-xl border overflow-hidden">
      {contacts.map((contact) => (
        <ContactCard
          key={contact.id}
          contact={contact}
          isDeleting={isDeleting === contact.id}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
