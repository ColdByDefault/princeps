/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version beta
 * @since beta
 * @module
 * @description
 */

"use client";

import {
  Mail,
  Phone,
  Building2,
  Briefcase,
  CalendarDays,
  Pencil,
  Trash2,
} from "lucide-react";
import { LABEL_ICON_MAP } from "@/components/labels/label-icons";
import type { LabelIconName } from "@/components/labels/label-icons";
import { useTranslations, useLocale } from "next-intl";
import { cn, formatDate } from "@/lib/utils";
import type { ContactRecord } from "@/types/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

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

interface ContactDetailDialogProps {
  contact: ContactRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (contact: ContactRecord) => void;
  onDelete: (contactId: string) => void;
}

export function ContactDetailDialog({
  contact,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: ContactDetailDialogProps) {
  const t = useTranslations("contacts");
  const locale = useLocale();

  if (!contact) return null;

  const initials = getInitials(contact.name);
  const avatarColor = getAvatarColor(contact.name);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="sr-only">
          <DialogTitle>{contact.name}</DialogTitle>
          <DialogDescription>
            {contact.role ?? contact.company ?? contact.name}
          </DialogDescription>
        </DialogHeader>

        {/* Profile header */}
        <div className="flex flex-col gap-3 pt-2">
          <div className="flex items-center gap-4">
            <div
              className={cn(
                "flex size-14 shrink-0 items-center justify-center rounded-full text-lg font-semibold text-white",
                avatarColor,
              )}
              aria-hidden="true"
            >
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-lg font-semibold leading-tight">
                {contact.name}
              </p>
              {(contact.role || contact.company) && (
                <div className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm">
                  {contact.role && (
                    <span className="flex items-center gap-1">
                      <Briefcase className="size-3.5" />
                      {contact.role}
                    </span>
                  )}
                  {contact.role && contact.company && <span>·</span>}
                  {contact.company && (
                    <span className="flex items-center gap-1">
                      <Building2 className="size-3.5" />
                      {contact.company}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer"
              aria-label={t("editLabel")}
              onClick={() => {
                onOpenChange(false);
                onEdit(contact);
              }}
            >
              <Pencil className="mr-1.5 size-3.5" />
              {t("editLabel")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
              aria-label={t("deleteLabel")}
              onClick={() => {
                onOpenChange(false);
                onDelete(contact.id);
              }}
            >
              <Trash2 className="mr-1.5 size-3.5" />
            </Button>
          </div>
        </div>

        <Separator />

        {/* Contact info */}
        <div className="space-y-2">
          {contact.email && (
            <a
              href={`mailto:${contact.email}`}
              className="text-muted-foreground hover:text-foreground flex items-center gap-2.5 text-sm transition-colors min-w-0"
            >
              <Mail className="size-4 shrink-0" />
              <span className="break-all">{contact.email}</span>
            </a>
          )}
          {contact.phone && (
            <a
              href={`tel:${contact.phone}`}
              className="text-muted-foreground hover:text-foreground flex items-center gap-2.5 text-sm transition-colors"
            >
              <Phone className="size-4 shrink-0" />
              {contact.phone}
            </a>
          )}
          {contact.lastContact && (
            <div className="text-muted-foreground flex items-center gap-2.5 text-sm">
              <CalendarDays className="size-4 shrink-0" />
              <span>
                {t("lastContactLabel")}:{" "}
                {formatDate(contact.lastContact, locale)}
              </span>
            </div>
          )}
        </div>

        {/* Notes */}
        {contact.notes && (
          <>
            <Separator />
            <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
              {contact.notes}
            </p>
          </>
        )}

        {/* Labels */}
        {contact.labels.length > 0 && (
          <>
            <Separator />
            <div className="flex flex-wrap gap-1.5">
              {contact.labels.map((label) => {
                const Icon = label.icon
                  ? LABEL_ICON_MAP[label.icon as LabelIconName]
                  : null;
                return (
                  <span
                    key={label.id}
                    className="inline-flex h-5 items-center gap-1 rounded-full px-2.5 text-[11px] font-medium"
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
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
