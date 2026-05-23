/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.6
 * @since canary-v1.1.6
 */

"use client";

import { useState } from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/core/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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

interface ItemCardProps {
  /**
   * Left slot — static icon wrapper OR interactive control (e.g. done-toggle).
   * Rendered as-is inside the flex row; no extra wrapper is added.
   */
  leading?: React.ReactNode;
  /** Main body content — feature-specific. */
  children: React.ReactNode;
  /**
   * Tooltipped inline icon buttons rendered before the ⋯ dropdown.
   * Use <CardIconButton> here.
   */
  inlineActions?: React.ReactNode;
  /** Edit handler — if provided, shows an Edit item in the dropdown. */
  onEdit?: () => void;
  editLabel?: string;
  /**
   * Delete handler — if provided, shows a Delete item in the dropdown.
   * Delete always opens an AlertDialog for confirmation before firing.
   */
  onDelete?: () => void;
  deleteLabel?: string;
  /** AlertDialog title. Defaults to deleteLabel. */
  deleteTitle?: string;
  /** AlertDialog description. */
  deleteDescription?: string;
  /** Cancel button label in the AlertDialog. */
  deleteCancelLabel?: string;
  /** Confirm button label in the AlertDialog. */
  deleteConfirmLabel?: string;
  /** aria-label for the ⋯ trigger button. */
  actionsAriaLabel?: string;
  /**
   * Disables pointer events and reduces opacity.
   * Use when the card is in a loading / deleting / updating state.
   */
  isDisabled?: boolean;
  className?: string;
}

export function ItemCard({
  leading,
  children,
  inlineActions,
  onEdit,
  editLabel = "Edit",
  onDelete,
  deleteLabel = "Delete",
  deleteTitle,
  deleteDescription,
  deleteCancelLabel = "Cancel",
  deleteConfirmLabel = "Delete",
  actionsAriaLabel = "Actions",
  isDisabled,
  className,
}: ItemCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const hasDropdown = !!(onEdit || onDelete);

  return (
    <>
      <div
        className={cn(
          "flex items-start gap-3 rounded-xl border border-border/60 bg-card px-4 py-3 transition-opacity",
          isDisabled && "opacity-60 pointer-events-none",
          className,
        )}
      >
        {/* Left slot */}
        {leading}

        {/* Body */}
        <div className="min-w-0 flex-1">{children}</div>

        {/* Action area */}
        {(inlineActions || hasDropdown) && (
          <div className="flex shrink-0 items-center gap-0.5">
            {inlineActions}

            {hasDropdown && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={actionsAriaLabel}
                      className="size-7 cursor-pointer text-muted-foreground"
                    />
                  }
                >
                  <MoreHorizontal className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onEdit && (
                    <DropdownMenuItem
                      onClick={onEdit}
                      className="cursor-pointer"
                    >
                      <Pencil className="mr-2 size-3.5" />
                      {editLabel}
                    </DropdownMenuItem>
                  )}
                  {onEdit && onDelete && <DropdownMenuSeparator />}
                  {onDelete && (
                    <DropdownMenuItem
                      onClick={() => setConfirmOpen(true)}
                      className="cursor-pointer text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 size-3.5" />
                      {deleteLabel}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        )}
      </div>

      {/* Delete confirmation dialog — rendered outside the card div so it portals correctly */}
      {onDelete && (
        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{deleteTitle ?? deleteLabel}</AlertDialogTitle>
              {deleteDescription && (
                <AlertDialogDescription>
                  {deleteDescription}
                </AlertDialogDescription>
              )}
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="cursor-pointer">
                {deleteCancelLabel}
              </AlertDialogCancel>
              <AlertDialogAction
                className="cursor-pointer"
                onClick={() => {
                  setConfirmOpen(false);
                  onDelete();
                }}
              >
                {deleteConfirmLabel}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
