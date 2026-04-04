/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { NotificationItem } from "./NotificationItem";
import type { NotificationRecord } from "@/types/api";

type NotificationDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notifications: NotificationRecord[];
  onDeleteOne: (id: string) => void;
  onDeleteAll: () => void;
};

export function NotificationDrawer({
  open,
  onOpenChange,
  notifications,
  onDeleteOne,
  onDeleteAll,
}: NotificationDrawerProps) {
  const t = useTranslations("notifications");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex flex-col w-full sm:max-w-sm p-0"
      >
        <SheetHeader className="flex flex-row items-center justify-start px-4 py-3 border-b border-border/50">
          <SheetTitle className="text-base font-semibold">
            {t("title")}
          </SheetTitle>
          {notifications.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="cursor-pointer text-muted-foreground hover:text-foreground h-7 px-2"
              onClick={onDeleteAll}
            >
              {t("clearAll")}
            </Button>
          )}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-center py-12">
              <p className="text-sm font-medium text-muted-foreground">
                {t("empty")}
              </p>
              <p className="text-xs text-muted-foreground/60">
                {t("emptyHint")}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {notifications.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onDelete={onDeleteOne}
                />
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
