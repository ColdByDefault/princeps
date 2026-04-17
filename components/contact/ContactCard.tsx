/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * SPDX-License-Identifier: Elastic-2.0
 */

"use client";

import { useState } from "react";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Mail,
  Phone,
  CalendarDays,
  Eye,
} from "lucide-react";
import { LABEL_ICON_MAP } from "@/components/labels/label-icons";
import type { LabelIconName } from "@/components/labels/label-icons";
import { useTranslations, useLocale } from "next-intl";
import { cn, formatDate } from "@/lib/utils";
import type { ContactRecord } from "@/types/api";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  const locale = useLocale();
  const initials = getInitials(contact.name);
  const avatarColor = getAvatarColor(contact.name);

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        aria-label={t("viewLabel", { name: contact.name })}
        className={cn(
          "group flex cursor-pointer items-center gap-4 px-4 py-3 transition-colors hover:bg-muted/40",
          isDeleting && "opacity-60 pointer-events-none",
        )}
        onClick={() => setShowDetailDialog(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setShowDetailDialog(true);
        }}
      >
        {/* Avatar */}
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white",
            avatarColor,
          )}
          aria-hidden="true"
        >
          {initials}
        </div>

        {/* Name + role/company — fixed width column */}
        <div className="min-w-0 w-48 shrink-0">
          <p className="truncate text-sm font-medium">{contact.name}</p>
          {(contact.role || contact.company) && (
            <p className="text-muted-foreground truncate text-xs">
              {[contact.role, contact.company].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>

        {/* Email */}
        <div className="hidden min-w-0 flex-1 sm:block">
          {contact.email ? (
            <a
              href={`mailto:${contact.email}`}
              className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-sm transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <Mail className="size-3.5 shrink-0" />
              <span className="truncate">{contact.email}</span>
            </a>
          ) : null}
        </div>

        {/* Phone */}
        <div className="hidden w-36 shrink-0 lg:block">
          {contact.phone ? (
            <a
              href={`tel:${contact.phone}`}
              className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-sm transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <Phone className="size-3.5 shrink-0" />
              <span className="truncate">{contact.phone}</span>
            </a>
          ) : null}
        </div>

        {/* Labels */}
        <div className="hidden w-40 shrink-0 items-center gap-1 xl:flex">
          {contact.labels.slice(0, 2).map((label) => {
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
          {contact.labels.length > 2 && (
            <span className="text-muted-foreground inline-flex h-5 shrink-0 items-center rounded-full border border-border px-2 text-[10px] font-medium">
              +{contact.labels.length - 2}
            </span>
          )}
        </div>

        {/* Last contact date */}
        <div className="text-muted-foreground hidden w-28 shrink-0 items-center gap-1 text-xs lg:flex">
          {contact.lastContact ? (
            <>
              <CalendarDays className="size-3 shrink-0" />
              {formatDate(contact.lastContact, locale)}
            </>
          ) : null}
        </div>

        {/* Actions */}
        <div className="ml-auto shrink-0" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="cursor-pointer"
                  aria-label={t("actionsLabel")}
                />
              }
            >
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => setShowDetailDialog(true)}
                className="cursor-pointer"
              >
                <Eye className="mr-2 size-4" />
                {t("viewLabel")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onEdit(contact)}
                className="cursor-pointer"
              >
                <Pencil className="mr-2 size-4" />
                {t("editLabel")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(contact.id)}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 size-4" />
                {t("deleteLabel")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

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
