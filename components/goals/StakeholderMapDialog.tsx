/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.4
 * @since canary-v1.1.4
 */

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Users, X, Plus, Flame, Minus, Snowflake } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { cn } from "@/lib/core/utils";
import type { GoalRecord, StakeholderRecord } from "@/types/api";

type AvailableContact = { id: string; name: string };

type StakeholderMapDialogProps = {
  goal: GoalRecord;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableContacts: AvailableContact[];
  onStakeholderAdded: (goalId: string, stakeholder: StakeholderRecord) => void;
  onStakeholderUpdated: (goalId: string, stakeholder: StakeholderRecord) => void;
  onStakeholderRemoved: (goalId: string, stakeholderId: string) => void;
};

const HEALTH_CONFIG = {
  warm: {
    icon: Flame,
    className:
      "text-green-600 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30",
    dotClass: "bg-green-500",
  },
  neutral: {
    icon: Minus,
    className:
      "text-amber-600 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30",
    dotClass: "bg-amber-500",
  },
  cold: {
    icon: Snowflake,
    className:
      "text-blue-600 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30",
    dotClass: "bg-blue-500",
  },
} as const;

type HealthKey = keyof typeof HEALTH_CONFIG;

const HEALTH_GROUPS: HealthKey[] = ["warm", "neutral", "cold"];

export function StakeholderMapDialog({
  goal,
  open,
  onOpenChange,
  availableContacts,
  onStakeholderAdded,
  onStakeholderUpdated,
  onStakeholderRemoved,
}: StakeholderMapDialogProps) {
  const t = useTranslations("goals.stakeholders");
  const [selectedContactId, setSelectedContactId] = useState("");
  const [role, setRole] = useState("");
  const [health, setHealth] = useState<HealthKey>("neutral");
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const linked = new Set(goal.stakeholders.map((s) => s.contactId));
  const unlinked = availableContacts.filter((c) => !linked.has(c.id));

  async function handleAdd() {
    if (!selectedContactId) return;
    setAdding(true);
    try {
      const res = await fetch("/api/stakeholders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId: selectedContactId,
          goalId: goal.id,
          role: role.trim() || null,
          health,
        }),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { stakeholder: StakeholderRecord };
      onStakeholderAdded(goal.id, data.stakeholder);
      toast.success(t("addSuccess"));
      setSelectedContactId("");
      setRole("");
      setHealth("neutral");
    } catch {
      toast.error(t("addError"));
    } finally {
      setAdding(false);
    }
  }

  async function handleHealthChange(id: string, newHealth: HealthKey) {
    try {
      const res = await fetch(`/api/stakeholders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ health: newHealth }),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { stakeholder: StakeholderRecord };
      onStakeholderUpdated(goal.id, data.stakeholder);
    } catch {
      toast.error(t("updateError"));
    }
  }

  async function handleRemove(id: string) {
    setRemovingId(id);
    try {
      const res = await fetch(`/api/stakeholders/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      onStakeholderRemoved(goal.id, id);
      toast.success(t("removeSuccess"));
    } catch {
      toast.error(t("removeError"));
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="size-4 shrink-0" />
            {t("dialogTitle")}: {goal.title}
          </DialogTitle>
          <DialogDescription>{t("dialogDescription")}</DialogDescription>
        </DialogHeader>

        {/* Stakeholders grouped by health */}
        {HEALTH_GROUPS.map((h) => {
          const entries = goal.stakeholders.filter((s) => s.health === h);
          if (entries.length === 0) return null;
          const cfg = HEALTH_CONFIG[h];
          return (
            <div key={h} className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t(`health.${h}`)}
              </p>
              <div className="space-y-1">
                {entries.map((s) => (
                  <div
                    key={s.id}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-3 py-2",
                      cfg.className,
                    )}
                  >
                    <span className={cn("size-2 rounded-full shrink-0", cfg.dotClass)} />
                    <span className="flex-1 text-sm font-medium truncate">
                      {s.contactName}
                    </span>
                    {s.role && (
                      <span className="text-xs text-muted-foreground italic truncate max-w-25">
                        {s.role}
                      </span>
                    )}
                    {/* Health toggle */}
                    <Select
                      value={s.health}
                      onValueChange={(v) => v && handleHealthChange(s.id, v as HealthKey)}
                    >
                      <SelectTrigger
                        className="h-6 w-20 text-xs cursor-pointer border-0 bg-transparent p-0 shadow-none focus:ring-0"
                        aria-label={t("changeHealth")}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="warm">{t("health.warm")}</SelectItem>
                        <SelectItem value="neutral">{t("health.neutral")}</SelectItem>
                        <SelectItem value="cold">{t("health.cold")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <button
                      type="button"
                      onClick={() => handleRemove(s.id)}
                      disabled={removingId === s.id}
                      aria-label={t("removeLabel")}
                      className="cursor-pointer text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {goal.stakeholders.length === 0 && (
          <p className="text-sm text-muted-foreground py-2">{t("empty")}</p>
        )}

        {/* Add form */}
        {unlinked.length > 0 && (
          <div className="space-y-2 border-t border-border/60 pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("addSection")}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">{t("contactLabel")}</Label>
                <Select value={selectedContactId} onValueChange={(v) => setSelectedContactId(v ?? "")}>
                  <SelectTrigger
                    className="cursor-pointer h-8 text-sm"
                    aria-label={t("contactLabel")}
                  >
                    <SelectValue placeholder={t("contactPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {unlinked.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t("healthLabel")}</Label>
                <Select
                  value={health}
                  onValueChange={(v) => v && setHealth(v as HealthKey)}
                >
                  <SelectTrigger
                    className="cursor-pointer h-8 text-sm"
                    aria-label={t("healthLabel")}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="warm">{t("health.warm")}</SelectItem>
                    <SelectItem value="neutral">{t("health.neutral")}</SelectItem>
                    <SelectItem value="cold">{t("health.cold")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t("roleLabel")}</Label>
              <Input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder={t("rolePlaceholder")}
                className="h-8 text-sm"
              />
            </div>
            <Button
              type="button"
              size="sm"
              disabled={adding || !selectedContactId}
              onClick={handleAdd}
              className="cursor-pointer w-full"
            >
              <Plus className="size-3.5 mr-1" />
              {adding ? t("adding") : t("addButton")}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
