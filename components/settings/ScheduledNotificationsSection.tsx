/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { getMessage } from "@/lib/i18n";
import { type MessageDictionary } from "@/types/i18n";
import { type ScheduledNotifPrefs } from "@/types/settings";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

type Props = {
  initialPrefs: ScheduledNotifPrefs;
  messages: MessageDictionary;
};

export function ScheduledNotificationsSection({
  initialPrefs,
  messages,
}: Props) {
  const [prefs, setPrefs] = useState<ScheduledNotifPrefs>(initialPrefs);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduledNotifications: prefs }),
      });
      if (!res.ok) throw new Error();
      toast.success(
        getMessage(
          messages,
          "scheduledNotif.saved",
          "Notification preferences saved.",
        ),
        { icon: <CheckCircle2 className="size-4 text-emerald-500" /> },
      );
    } catch {
      toast.error(
        getMessage(
          messages,
          "scheduledNotif.saveError",
          "Failed to save preferences.",
        ),
      );
    } finally {
      setSaving(false);
    }
  };

  const set = <K extends keyof ScheduledNotifPrefs>(
    key: K,
    value: ScheduledNotifPrefs[K],
  ) => setPrefs((p) => ({ ...p, [key]: value }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-semibold">
          {getMessage(
            messages,
            "scheduledNotif.title",
            "Scheduled Notifications",
          )}
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          {getMessage(
            messages,
            "scheduledNotif.description",
            "Choose which notifications the assistant sends automatically and how often.",
          )}
        </p>
      </div>

      <div className="space-y-4">
        {/* Daily briefing */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-0.5">
            <Label className="text-sm">
              {getMessage(
                messages,
                "scheduledNotif.briefing.label",
                "Daily briefing",
              )}
            </Label>
            <p className="text-xs text-muted-foreground">
              {getMessage(
                messages,
                "scheduledNotif.briefing.description",
                "Receive an AI-generated briefing in your notification inbox.",
              )}
            </p>
          </div>
          <Select
            value={prefs.briefing}
            onValueChange={(v) =>
              set("briefing", v as ScheduledNotifPrefs["briefing"])
            }
          >
            <SelectTrigger className="w-32 cursor-pointer shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="off" className="cursor-pointer">
                {getMessage(messages, "scheduledNotif.off", "Off")}
              </SelectItem>
              <SelectItem value="daily" className="cursor-pointer">
                {getMessage(messages, "scheduledNotif.daily", "Daily")}
              </SelectItem>
              <SelectItem value="weekly" className="cursor-pointer">
                {getMessage(messages, "scheduledNotif.weekly", "Weekly")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Overdue task alerts */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-0.5">
            <Label className="text-sm">
              {getMessage(
                messages,
                "scheduledNotif.tasksOverdue.label",
                "Overdue task alerts",
              )}
            </Label>
            <p className="text-xs text-muted-foreground">
              {getMessage(
                messages,
                "scheduledNotif.tasksOverdue.description",
                "Get notified when tasks are past their due date.",
              )}
            </p>
          </div>
          <Select
            value={prefs.tasksOverdue}
            onValueChange={(v) =>
              set("tasksOverdue", v as ScheduledNotifPrefs["tasksOverdue"])
            }
          >
            <SelectTrigger className="w-32 cursor-pointer shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="off" className="cursor-pointer">
                {getMessage(messages, "scheduledNotif.off", "Off")}
              </SelectItem>
              <SelectItem value="daily" className="cursor-pointer">
                {getMessage(messages, "scheduledNotif.daily", "Daily")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Meeting follow-up */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-0.5">
            <Label className="text-sm">
              {getMessage(
                messages,
                "scheduledNotif.meetingFollowup.label",
                "Meeting follow-up",
              )}
            </Label>
            <p className="text-xs text-muted-foreground">
              {getMessage(
                messages,
                "scheduledNotif.meetingFollowup.description",
                "Nudge to capture notes for meetings that ended without a summary.",
              )}
            </p>
          </div>
          <Select
            value={prefs.meetingFollowup}
            onValueChange={(v) =>
              set(
                "meetingFollowup",
                v as ScheduledNotifPrefs["meetingFollowup"],
              )
            }
          >
            <SelectTrigger className="w-32 cursor-pointer shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="off" className="cursor-pointer">
                {getMessage(messages, "scheduledNotif.off", "Off")}
              </SelectItem>
              <SelectItem value="on" className="cursor-pointer">
                {getMessage(messages, "scheduledNotif.on", "On")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Weekly digest */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-0.5">
            <Label className="text-sm">
              {getMessage(
                messages,
                "scheduledNotif.weeklyDigest.label",
                "Weekly digest",
              )}
            </Label>
            <p className="text-xs text-muted-foreground">
              {getMessage(
                messages,
                "scheduledNotif.weeklyDigest.description",
                "Friday summary of meetings held, tasks closed, and decisions made.",
              )}
            </p>
          </div>
          <Select
            value={prefs.weeklyDigest}
            onValueChange={(v) =>
              set("weeklyDigest", v as ScheduledNotifPrefs["weeklyDigest"])
            }
          >
            <SelectTrigger className="w-32 cursor-pointer shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="off" className="cursor-pointer">
                {getMessage(messages, "scheduledNotif.off", "Off")}
              </SelectItem>
              <SelectItem value="on" className="cursor-pointer">
                {getMessage(messages, "scheduledNotif.on", "On")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button
          size="sm"
          onClick={() => void handleSave()}
          disabled={saving}
          className="cursor-pointer"
        >
          {saving
            ? getMessage(messages, "settings.saving", "Saving…")
            : getMessage(messages, "settings.save", "Save")}
        </Button>
      </div>
    </div>
  );
}
