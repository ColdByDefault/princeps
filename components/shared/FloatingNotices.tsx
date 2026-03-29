/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import * as React from "react";
import {
  X,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Loader2,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotice, type NoticeType } from "./notice-context";

const noticeStyles: Record<NoticeType, { iconColor: string; border: string }> =
  {
    success: {
      iconColor: "text-emerald-500",
      border: "border-l-4 border-l-emerald-500",
    },
    error: { iconColor: "text-red-500", border: "border-l-4 border-l-red-500" },
    warning: {
      iconColor: "text-amber-500",
      border: "border-l-4 border-l-amber-500",
    },
    info: {
      iconColor: "text-blue-500",
      border: "border-l-4 border-l-blue-500",
    },
    neutral: { iconColor: "text-muted-foreground", border: "" },
    loading: { iconColor: "text-muted-foreground", border: "" },
  };

const noticeIcons: Record<NoticeType, React.ElementType> = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
  neutral: Bell,
  loading: Loader2,
};

function NoticeItem({
  type,
  title,
  message,
  dismissLabel,
  onClose,
}: {
  type: NoticeType;
  title: string;
  message?: string;
  dismissLabel?: string;
  onClose: () => void;
}) {
  const [isExiting, setIsExiting] = React.useState(false);
  const styles = noticeStyles[type];
  const Icon = noticeIcons[type];

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(onClose, 200);
  };

  return (
    <div
      className={cn(
        "pointer-events-auto w-full max-w-sm overflow-hidden rounded-xl border border-border bg-card shadow-lg backdrop-blur-sm transition-all duration-200",
        styles.border,
        isExiting ? "translate-x-full opacity-0" : "translate-x-0 opacity-100",
        "animate-in slide-in-from-right-full",
      )}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="shrink-0 rounded-full bg-muted p-2">
            <Icon
              className={cn(
                "size-4",
                styles.iconColor,
                type === "loading" && "animate-spin",
              )}
            />
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="text-sm font-semibold text-foreground">{title}</p>
            {message ? (
              <p className="mt-1 text-sm text-muted-foreground">{message}</p>
            ) : null}
          </div>
          <button
            type="button"
            aria-label={dismissLabel ?? "Dismiss"}
            onClick={handleClose}
            className="cursor-pointer shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function FloatingNotices() {
  const { notices, removeNotice } = useNotice();

  return (
    <div
      aria-live="assertive"
      className="pointer-events-none fixed inset-0 z-50 flex flex-col items-end justify-end gap-3 p-4 sm:p-6"
    >
      {notices.map((notice) => (
        <NoticeItem
          key={notice.id}
          {...notice}
          onClose={() => removeNotice(notice.id)}
        />
      ))}
    </div>
  );
}
