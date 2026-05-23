/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.4
 */

"use client";

import { ExternalLink, BookCheck, Archive, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import type { ReadingItemRecord } from "@/types/api";

type ReadingItemCardProps = {
  item: ReadingItemRecord;
  onMarkRead: () => void;
  onArchive: () => void;
  onDelete: () => void;
  isUpdating: boolean;
  isDeleting: boolean;
};

function RelevanceBadge({ score }: { score: number | null }) {
  const t = useTranslations("readingQueue");
  if (score === null) return null;

  const variant =
    score >= 0.75
      ? "default"
      : score >= 0.5
        ? "secondary"
        : ("outline" as const);

  return (
    <Badge variant={variant} className="text-xs tabular-nums">
      {t("scoreLabel")}: {(score * 100).toFixed(0)}%
    </Badge>
  );
}

export function ReadingItemCard({
  item,
  onMarkRead,
  onArchive,
  onDelete,
  isUpdating,
  isDeleting,
}: ReadingItemCardProps) {
  const t = useTranslations("readingQueue");

  const hostname = (() => {
    try {
      return new URL(item.url).hostname.replace(/^www\./, "");
    } catch {
      return item.url;
    }
  })();

  return (
    <Card className="flex flex-col gap-0">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="line-clamp-2 text-sm font-medium leading-snug">
            {item.title ?? hostname}
          </CardTitle>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t("fields.openLink")}
            className="shrink-0 cursor-pointer text-muted-foreground hover:text-foreground"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
        <p className="truncate text-xs text-muted-foreground">{hostname}</p>
      </CardHeader>

      {item.aiSummary && (
        <CardContent className="pb-2">
          <p className="line-clamp-3 text-xs text-muted-foreground">
            {item.aiSummary}
          </p>
        </CardContent>
      )}

      <CardFooter className="mt-auto flex items-center justify-between gap-2 pt-2">
        <RelevanceBadge score={item.relevanceScore} />

        <div className="flex items-center gap-1">
          {item.status === "unread" && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onMarkRead}
                      disabled={isUpdating}
                      aria-label={t("status.markRead")}
                      className="size-7 cursor-pointer"
                    />
                  }
                >
                  <BookCheck className="size-3.5" />
                </TooltipTrigger>
                <TooltipContent>{t("status.markRead")}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {item.status !== "archived" && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onArchive}
                      disabled={isUpdating}
                      aria-label={t("status.archive")}
                      className="size-7 cursor-pointer"
                    />
                  }
                >
                  <Archive className="size-3.5" />
                </TooltipTrigger>
                <TooltipContent>{t("status.archive")}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onDelete}
                    disabled={isDeleting || isUpdating}
                    aria-label={t("deleteDialog.trigger")}
                    className="size-7 cursor-pointer text-destructive hover:text-destructive"
                  />
                }
              >
                <Trash2 className="size-3.5" />
              </TooltipTrigger>
              <TooltipContent>{t("deleteDialog.trigger")}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardFooter>
    </Card>
  );
}
