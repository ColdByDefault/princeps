/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
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
} from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { ContactRecord } from "@/types/api";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  onEdit: (contact: ContactRecord) => void;
  onDelete: (contactId: string) => Promise<void>;
}

export function ContactCard({ contact, onEdit, onDelete }: ContactCardProps) {
  const t = useTranslations("contacts");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);
    try {
      await onDelete(contact.id);
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  const initials = getInitials(contact.name);
  const avatarColor = getAvatarColor(contact.name);

  return (
    <>
      <div className="group flex items-center gap-4 px-4 py-3 transition-colors hover:bg-muted/40">
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
            >
              <Phone className="size-3.5 shrink-0" />
              <span className="truncate">{contact.phone}</span>
            </a>
          ) : null}
        </div>

        {/* Labels */}
        <div className="hidden w-40 shrink-0 items-center gap-1 overflow-hidden xl:flex">
          {contact.labels.map((label) => (
            <span
              key={label.id}
              className="inline-flex h-5 shrink-0 items-center rounded-full px-2 text-[10px] font-medium"
              style={{
                backgroundColor: `${label.color}22`,
                color: label.color,
                border: `1px solid ${label.color}44`,
              }}
            >
              {label.name}
            </span>
          ))}
        </div>

        {/* Last contact date */}
        <div className="text-muted-foreground hidden w-28 shrink-0 items-center gap-1 text-xs lg:flex">
          {contact.lastContact ? (
            <>
              <CalendarDays className="size-3 shrink-0" />
              {formatDate(contact.lastContact)}
            </>
          ) : null}
        </div>

        {/* Actions */}
        <div className="ml-auto shrink-0">
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
                onClick={() => onEdit(contact)}
                className="cursor-pointer"
              >
                <Pencil className="mr-2 size-4" />
                {t("editLabel")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 size-4" />
                {t("deleteLabel")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteDialog.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteDialog.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="cursor-pointer">
              {t("deleteDialog.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="cursor-pointer bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "…" : t("deleteDialog.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
