/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.6
 * @since beta
 */

"use client";

import { useState } from "react";
import { Mail, Phone, CalendarDays, Eye } from "lucide-react";
import { LABEL_ICON_MAP } from "@/components/labels/label-icons";
import type { LabelIconName } from "@/components/labels/label-icons";
import { useTranslations, useLocale } from "next-intl";
import { cn, formatDate } from "@/lib/core/utils";
import type { ContactRecord } from "@/types/api";
import { ItemCard } from "@/components/shared/ItemCard";
import { CardIconButton } from "@/components/shared/CardIconButton";
import { ContactDetailDialog } from "./ContactDetailDialog";

const AVATAR_COLORS = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-orange-500",
  "bg-pink-500",
];

function getAvatarColor(name: string): string {
  const sum = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

interface ContactCardProps {
  contact: ContactRecord;
  isDeleting?: boolean;
  onEdit: (contact: ContactRecord) => void;
  onDelete: (contactId: string) => void;
}

export function ContactCard({
  contact,
  isDeleting,
  onEdit,
  onDelete,
}: ContactCardProps) {
  const t = useTranslations("contacts");
const tCommon = useTranslations("common");
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const locale = useLocale();

  const initials = getInitials(contact.name);
  const avatarColor = getAvatarColor(contact.name);

  return (
    <>
      <ItemCard
        isDisabled={!!isDeleting}
        leading={
          <div
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white",
              avatarColor,
            )}
            aria-hidden="true"
          >
            {initials}
          </div>
        }
        inlineActions={
          <CardIconButton
            icon={<Eye className="size-3.5" />}
            label={t("viewLabel")}
            onClick={() => setShowDetailDialog(true)}
          />
        }
        onEdit={() => onEdit(contact)}
        editLabel={t("editLabel")}
        onDelete={() => onDelete(contact.id)}
        deleteLabel={tCommon("actions.delete")}
        deleteTitle={t("deleteDialog.title")}
        deleteDescription={t("deleteDialog.description")}
        deleteCancelLabel={tCommon("actions.cancel")}
        deleteConfirmLabel={tCommon("actions.delete")}
        actionsAriaLabel={t("actionsLabel")}
      >
        <div className="space-y-1">
          <p className="text-sm font-medium leading-snug">{contact.name}</p>
          {(contact.role || contact.company) && (
            <p className="text-xs text-muted-foreground">
              {[contact.role, contact.company].filter(Boolean).join(" · ")}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {contact.email && (
              <a
                href={`mailto:${contact.email}`}
                className="flex items-center gap-1 hover:text-foreground transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <Mail className="size-3.5 shrink-0" />
                {contact.email}
              </a>
            )}
            {contact.phone && (
              <a
                href={`tel:${contact.phone}`}
                className="flex items-center gap-1 hover:text-foreground transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <Phone className="size-3.5 shrink-0" />
                {contact.phone}
              </a>
            )}
            {contact.lastContact && (
              <span className="flex items-center gap-1">
                <CalendarDays className="size-3.5 shrink-0" />
                {formatDate(contact.lastContact, locale)}
              </span>
            )}
          </div>
          {contact.labels.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-0.5">
              {contact.labels.slice(0, 4).map((label) => {
                const Icon = label.icon
                  ? LABEL_ICON_MAP[label.icon as LabelIconName]
                  : null;
                return (
                  <span
                    key={label.id}
                    className="inline-flex h-5 shrink-0 items-center gap-1 rounded-full px-2 text-[10px] font-medium"
                    style={{
                      backgroundColor: `${label.color}22`,
                      color: label.color,
                      border: `1px solid ${label.color}44`,
                    }}
                  >
                    {Icon && <Icon className="size-3 shrink-0" />}
                    {label.name}
                  </span>
                );
              })}
              {contact.labels.length > 4 && (
                <span className="text-muted-foreground inline-flex h-5 shrink-0 items-center rounded-full border border-border px-2 text-[10px] font-medium">
                  +{contact.labels.length - 4}
                </span>
              )}
            </div>
          )}
        </div>
      </ItemCard>

      <ContactDetailDialog
        contact={contact}
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </>
  );
}
