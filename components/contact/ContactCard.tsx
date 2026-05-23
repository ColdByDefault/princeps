/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.7
 * @since beta
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
import { cn, formatDate } from "@/lib/core/utils";
import type { ContactRecord } from "@/types/api";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ViewDetailDialog,
  type DetailField,
} from "@/components/shared/ViewDetailDialog";

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
  const [viewOpen, setViewOpen] = useState(false);
  const locale = useLocale();
  const initials = getInitials(contact.name);
  const avatarColor = getAvatarColor(contact.name);

  const fields: DetailField[] = [
    { label: t("fields.role"), value: contact.role, hidden: !contact.role },
    {
      label: t("fields.company"),
      value: contact.company,
      hidden: !contact.company,
    },
    { label: t("fields.email"), value: contact.email, hidden: !contact.email },
    { label: t("fields.phone"), value: contact.phone, hidden: !contact.phone },
    {
      label: t("fields.notes"),
      value: <p className="whitespace-pre-wrap">{contact.notes}</p>,
      hidden: !contact.notes,
    },
    {
      label: t("lastContactLabel"),
      value: contact.lastContact
        ? formatDate(contact.lastContact, locale)
        : null,
      hidden: !contact.lastContact,
    },
    {
      label: t("fields.labels"),
      value: (
        <div className="flex flex-wrap gap-1">
          {contact.labels.map((lbl) => {
            const Icon = lbl.icon
              ? LABEL_ICON_MAP[lbl.icon as LabelIconName]
              : null;
            return (
              <span
                key={lbl.id}
                className="inline-flex h-5 items-center gap-1 rounded-full px-2 text-[10px] font-medium"
                style={{
                  backgroundColor: `${lbl.color}22`,
                  color: lbl.color,
                  border: `1px solid ${lbl.color}44`,
                }}
              >
                {Icon && <Icon className="size-3 shrink-0" />}
                {lbl.name}
              </span>
            );
          })}
        </div>
      ),
      hidden: !contact.labels.length,
    },
    {
      label: t("viewDialog.createdAt"),
      value: formatDate(contact.createdAt, locale),
    },
  ];

  return (
    <>
      <div
        className={cn(
          "flex items-start gap-3 rounded-xl border border-border/60 bg-card px-4 py-3 transition-opacity",
          isDeleting && "opacity-60 pointer-events-none",
        )}
      >
        {/* Avatar */}
        <div
          className={cn(
            "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white",
            avatarColor,
          )}
          aria-hidden="true"
        >
          {initials}
        </div>

        {/* Body */}
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium leading-snug">
              {contact.name}
            </p>
            {(contact.role || contact.company) && (
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {[contact.role, contact.company].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>

          {(contact.email || contact.phone || contact.lastContact) && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {contact.email && (
                <a
                  href={`mailto:${contact.email}`}
                  className="inline-flex min-w-0 max-w-full items-center gap-1.5 transition-colors hover:text-foreground sm:max-w-[18rem]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Mail className="size-3.5 shrink-0" />
                  <span className="truncate">{contact.email}</span>
                </a>
              )}
              {contact.phone && (
                <a
                  href={`tel:${contact.phone}`}
                  className="inline-flex min-w-0 max-w-full items-center gap-1.5 transition-colors hover:text-foreground sm:max-w-48"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Phone className="size-3.5 shrink-0" />
                  <span className="truncate">{contact.phone}</span>
                </a>
              )}
              {contact.lastContact && (
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="size-3.5 shrink-0" />
                  {formatDate(contact.lastContact, locale)}
                </span>
              )}
            </div>
          )}

          {contact.labels.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              {contact.labels.slice(0, 3).map((label) => {
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
              {contact.labels.length > 3 && (
                <span className="inline-flex h-5 shrink-0 items-center rounded-full border border-border px-2 text-[10px] font-medium text-muted-foreground">
                  +{contact.labels.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-0.5">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={t("viewLabel")}
                    className="size-7 cursor-pointer shrink-0 text-muted-foreground"
                    onClick={() => setViewOpen(true)}
                  />
                }
              >
                <Eye className="size-3.5" />
              </TooltipTrigger>
              <TooltipContent>{t("viewLabel")}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={t("actionsLabel")}
                  title={t("actionsLabel")}
                  className="size-7 cursor-pointer shrink-0 text-muted-foreground"
                />
              }
            >
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => onEdit(contact)}
                className="cursor-pointer"
              >
                <Pencil className="mr-2 size-3.5" />
                {t("editLabel")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(contact.id)}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 size-3.5" />
                {t("deleteLabel")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <ViewDetailDialog
        open={viewOpen}
        onOpenChange={setViewOpen}
        title={contact.name}
        fields={fields}
      />
    </>
  );
}
