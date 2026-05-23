/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version beta
 * @since beta
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
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-start gap-3 rounded-xl border border-border/60 bg-card px-4 py-3"
          >
            <Skeleton className="size-9 rounded-full shrink-0" />
            <div className="min-w-0 flex-1 flex flex-col gap-1.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-48 max-w-full" />
            </div>
            <div className="flex shrink-0 gap-1">
              <Skeleton className="size-7" />
              <Skeleton className="size-7" />
            </div>
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
    <div className="space-y-2">
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
