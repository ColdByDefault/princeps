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
  Building2,
  Briefcase,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { ContactRecord } from "@/types/api";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardAction,
} from "@/components/ui/card";
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

  return (
    <>
      <Card className="relative">
        <CardHeader>
          <CardTitle className="text-lg">{contact.name}</CardTitle>
          {(contact.role || contact.company) && (
            <CardDescription className="flex flex-wrap items-center gap-x-3 gap-y-1">
              {contact.role && (
                <span className="flex items-center gap-1">
                  <Briefcase className="size-3.5" />
                  {contact.role}
                </span>
              )}
              {contact.company && (
                <span className="flex items-center gap-1">
                  <Building2 className="size-3.5" />
                  {contact.company}
                </span>
              )}
            </CardDescription>
          )}
          <CardAction>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="cursor-pointer"
                    aria-label={t("actionsLabel")}
                    title={t("actionsLabel")}
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
          </CardAction>
        </CardHeader>

        <CardContent className="flex flex-col gap-2">
          {contact.email && (
            <a
              href={`mailto:${contact.email}`}
              className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm transition-colors"
            >
              <Mail className="size-4" />
              {contact.email}
            </a>
          )}
          {contact.phone && (
            <a
              href={`tel:${contact.phone}`}
              className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm transition-colors"
            >
              <Phone className="size-4" />
              {contact.phone}
            </a>
          )}
          {contact.notes && (
            <p className="text-muted-foreground mt-1 text-sm line-clamp-2">
              {contact.notes}
            </p>
          )}
          {contact.labels.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {contact.labels.map((label) => (
                <span
                  key={label.id}
                  className="inline-flex h-5 items-center rounded-full px-2 text-[10px] font-medium text-white"
                  style={{ backgroundColor: label.color }}
                >
                  {label.name}
                </span>
              ))}
            </div>
          )}
          {contact.lastContact && (
            <p className="text-muted-foreground mt-1 text-xs">
              {t("lastContactLabel")}: {formatDate(contact.lastContact)}
            </p>
          )}
        </CardContent>
      </Card>

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
