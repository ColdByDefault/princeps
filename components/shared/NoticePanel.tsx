/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import {
  X,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Loader2,
  Bell,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { type NoticeType } from "./notice-context";

const panelStyles: Record<
  NoticeType,
  {
    bg: string;
    border: string;
    icon: string;
    iconColor: string;
    titleColor: string;
    bodyColor: string;
    closeColor: string;
  }
> = {
  success: {
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    border: "border-emerald-200 dark:border-emerald-800",
    icon: "bg-emerald-100 dark:bg-emerald-900",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    titleColor: "text-emerald-900 dark:text-emerald-100",
    bodyColor: "text-emerald-700 dark:text-emerald-300",
    closeColor:
      "text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-300",
  },
  error: {
    bg: "bg-red-50 dark:bg-red-950/40",
    border: "border-red-200 dark:border-red-800",
    icon: "bg-red-100 dark:bg-red-900",
    iconColor: "text-red-600 dark:text-red-400",
    titleColor: "text-red-900 dark:text-red-100",
    bodyColor: "text-red-700 dark:text-red-300",
    closeColor: "text-red-500 hover:text-red-700 dark:hover:text-red-300",
  },
  warning: {
    bg: "bg-amber-50 dark:bg-amber-950/40",
    border: "border-amber-200 dark:border-amber-800",
    icon: "bg-amber-100 dark:bg-amber-900",
    iconColor: "text-amber-600 dark:text-amber-400",
    titleColor: "text-amber-900 dark:text-amber-100",
    bodyColor: "text-amber-700 dark:text-amber-300",
    closeColor: "text-amber-500 hover:text-amber-700 dark:hover:text-amber-300",
  },
  info: {
    bg: "bg-blue-50 dark:bg-blue-950/40",
    border: "border-blue-200 dark:border-blue-800",
    icon: "bg-blue-100 dark:bg-blue-900",
    iconColor: "text-blue-600 dark:text-blue-400",
    titleColor: "text-blue-900 dark:text-blue-100",
    bodyColor: "text-blue-700 dark:text-blue-300",
    closeColor: "text-blue-500 hover:text-blue-700 dark:hover:text-blue-300",
  },
  neutral: {
    bg: "bg-slate-50 dark:bg-slate-900/40",
    border: "border-slate-200 dark:border-slate-700",
    icon: "bg-slate-100 dark:bg-slate-800",
    iconColor: "text-slate-600 dark:text-slate-400",
    titleColor: "text-slate-900 dark:text-slate-100",
    bodyColor: "text-slate-600 dark:text-slate-400",
    closeColor: "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300",
  },
  loading: {
    bg: "bg-indigo-50 dark:bg-indigo-950/40",
    border: "border-indigo-200 dark:border-indigo-800",
    icon: "bg-indigo-100 dark:bg-indigo-900",
    iconColor: "text-indigo-600 dark:text-indigo-400",
    titleColor: "text-indigo-900 dark:text-indigo-100",
    bodyColor: "text-indigo-700 dark:text-indigo-300",
    closeColor:
      "text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300",
  },
};

const panelIcons: Record<NoticeType, LucideIcon> = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
  neutral: Bell,
  loading: Loader2,
};

type NoticePanelProps = {
  type: NoticeType;
  title: string;
  message?: string;
  /** Accessible label for the dismiss button — pass a translated string (e.g. "Schließen") */
  dismissLabel?: string;
  onDismiss?: () => void;
  className?: string;
};

export function NoticePanel({
  type,
  title,
  message,
  dismissLabel,
  onDismiss,
  className,
}: NoticePanelProps) {
  const styles = panelStyles[type];
  const Icon = panelIcons[type];

  return (
    <div
      role="status"
      aria-live={type === "error" ? "assertive" : "polite"}
      className={cn(
        "flex items-start gap-3 rounded-xl border p-4",
        styles.bg,
        styles.border,
        className,
      )}
    >
      <div className={cn("shrink-0 rounded-full p-1.5", styles.icon)}>
        <Icon
          className={cn(
            "size-4",
            styles.iconColor,
            type === "loading" && "animate-spin",
          )}
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm font-semibold", styles.titleColor)}>
          {title}
        </p>
        {message ? (
          <p className={cn("mt-1 text-sm", styles.bodyColor)}>{message}</p>
        ) : null}
      </div>
      {onDismiss ? (
        <button
          type="button"
          aria-label={dismissLabel ?? "Dismiss"}
          onClick={onDismiss}
          className={cn(
            "cursor-pointer shrink-0 rounded-md p-1 transition-colors hover:bg-black/5 dark:hover:bg-white/10",
            styles.closeColor,
          )}
        >
          <X className="size-4" />
        </button>
      ) : null}
    </div>
  );
}
