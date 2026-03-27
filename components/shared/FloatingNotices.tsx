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

const noticeStyles: Record<
  NoticeType,
  { bg: string; border: string; icon: string; iconColor: string }
> = {
  success: {
    bg: "bg-emerald-50 dark:bg-emerald-950/50",
    border: "border-emerald-200 dark:border-emerald-800",
    icon: "bg-emerald-100 dark:bg-emerald-900",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  error: {
    bg: "bg-red-50 dark:bg-red-950/50",
    border: "border-red-200 dark:border-red-800",
    icon: "bg-red-100 dark:bg-red-900",
    iconColor: "text-red-600 dark:text-red-400",
  },
  warning: {
    bg: "bg-amber-50 dark:bg-amber-950/50",
    border: "border-amber-200 dark:border-amber-800",
    icon: "bg-amber-100 dark:bg-amber-900",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  info: {
    bg: "bg-blue-50 dark:bg-blue-950/50",
    border: "border-blue-200 dark:border-blue-800",
    icon: "bg-blue-100 dark:bg-blue-900",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  neutral: {
    bg: "bg-slate-50 dark:bg-slate-900/50",
    border: "border-slate-200 dark:border-slate-700",
    icon: "bg-slate-100 dark:bg-slate-800",
    iconColor: "text-slate-600 dark:text-slate-400",
  },
  loading: {
    bg: "bg-indigo-50 dark:bg-indigo-950/50",
    border: "border-indigo-200 dark:border-indigo-800",
    icon: "bg-indigo-100 dark:bg-indigo-900",
    iconColor: "text-indigo-600 dark:text-indigo-400",
  },
};

const noticeIcons: Record<NoticeType, React.ElementType> = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
  neutral: Bell,
  loading: Loader2,
};

const noticeTitleColors: Record<NoticeType, string> = {
  success: "text-emerald-900 dark:text-emerald-100",
  error: "text-red-900 dark:text-red-100",
  warning: "text-amber-900 dark:text-amber-100",
  info: "text-blue-900 dark:text-blue-100",
  neutral: "text-slate-900 dark:text-slate-100",
  loading: "text-indigo-900 dark:text-indigo-100",
};

const noticeBodyColors: Record<NoticeType, string> = {
  success: "text-emerald-700 dark:text-emerald-300",
  error: "text-red-700 dark:text-red-300",
  warning: "text-amber-700 dark:text-amber-300",
  info: "text-blue-700 dark:text-blue-300",
  neutral: "text-slate-600 dark:text-slate-400",
  loading: "text-indigo-700 dark:text-indigo-300",
};

const noticeCloseColors: Record<NoticeType, string> = {
  success:
    "text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-300",
  error: "text-red-500 hover:text-red-700 dark:hover:text-red-300",
  warning: "text-amber-500 hover:text-amber-700 dark:hover:text-amber-300",
  info: "text-blue-500 hover:text-blue-700 dark:hover:text-blue-300",
  neutral: "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300",
  loading: "text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300",
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
        "pointer-events-auto w-full max-w-sm overflow-hidden rounded-xl border shadow-lg backdrop-blur-sm transition-all duration-200",
        styles.bg,
        styles.border,
        isExiting ? "translate-x-full opacity-0" : "translate-x-0 opacity-100",
        "animate-in slide-in-from-right-full",
      )}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn("shrink-0 rounded-full p-2", styles.icon)}>
            <Icon
              className={cn(
                "size-4",
                styles.iconColor,
                type === "loading" && "animate-spin",
              )}
            />
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <p className={cn("text-sm font-semibold", noticeTitleColors[type])}>
              {title}
            </p>
            {message ? (
              <p className={cn("mt-1 text-sm", noticeBodyColors[type])}>
                {message}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            aria-label={dismissLabel ?? "Dismiss"}
            onClick={handleClose}
            className={cn(
              "cursor-pointer shrink-0 rounded-md p-1.5 transition-colors hover:bg-black/5 dark:hover:bg-white/10",
              noticeCloseColors[type],
            )}
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
