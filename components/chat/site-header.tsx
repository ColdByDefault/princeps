/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * SPDX-License-Identifier: Elastic-2.0
 */

"use client";

import { useEffect, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  useChatSettings,
  CHAT_SETTINGS_DEFAULTS,
  type ChatSettings,
} from "@/hooks/use-chat-settings";
import type { ActiveProvider, ProviderStatusPayload } from "@/types/llm";

const PROVIDER_LABEL: Record<ActiveProvider, string> = {
  openAi: "OpenAI",
  ollama: "Ollama",
  groq: "Groq",
};

export function SiteHeader() {
  const t = useTranslations("chat.settings");
  const [provider, setProvider] = useState<ActiveProvider | null>(null);
  const [model, setModel] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const { settings, update } = useChatSettings();
  const [draft, setDraft] = useState<ChatSettings>(settings);

  useEffect(() => {
    fetch("/api/settings/provider-status")
      .then((r) => r.json())
      .then((data: ProviderStatusPayload) => {
        setProvider(data.active);
        setModel(data.activeModel);
      })
      .catch(() => {});
  }, []);

  const handleOpenChange = (next: boolean) => {
    if (next) setDraft(settings);
    setOpen(next);
  };

  const handleSave = () => {
    update(draft);
    setOpen(false);
  };

  const timeoutSec = Math.round(draft.timeoutMs / 1000);

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
      <SidebarTrigger className="-ml-1 cursor-pointer" />

      <div className="ml-auto flex items-center gap-1">
        {provider && model && (
          <div className="flex items-center gap-2 text-xs text-gray-300 dark:text-gray-600 pr-1">
            <span>{PROVIDER_LABEL[provider]}</span>
            <span>{model}</span>
          </div>
        )}

        <Dialog open={open} onOpenChange={handleOpenChange}>
          <TooltipProvider>
            <Tooltip>
              <DialogTrigger
                render={
                  <TooltipTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={t("tooltipLabel")}
                        className="cursor-pointer text-muted-foreground hover:text-foreground border border-transparent hover:border-border rounded-lg"
                      />
                    }
                  />
                }
              >
                <SlidersHorizontal className="h-4 w-4" />
              </DialogTrigger>
              <TooltipContent side="bottom">{t("tooltipLabel")}</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <DialogContent showCloseButton className="sm:max-w-xs">
            <DialogHeader>
              <DialogTitle>{t("title")}</DialogTitle>
              <DialogDescription>{t("description")}</DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-5 pt-1">
              {/* Temperature */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">
                    {t("temperature")}
                  </label>
                  <span className="text-sm tabular-nums text-muted-foreground">
                    {draft.temperature.toFixed(1)}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={2}
                  step={0.1}
                  value={draft.temperature}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      temperature: parseFloat(e.target.value),
                    }))
                  }
                  className="w-full cursor-pointer accent-foreground"
                />
                <p className="text-xs text-muted-foreground">
                  {t("temperatureDescription")}
                </p>
              </div>

              {/* Timeout */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">{t("timeout")}</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={5}
                    max={120}
                    step={5}
                    value={timeoutSec}
                    onChange={(e) => {
                      const val = Math.min(
                        120,
                        Math.max(5, parseInt(e.target.value, 10) || 5),
                      );
                      setDraft((d) => ({ ...d, timeoutMs: val * 1000 }));
                    }}
                    className="w-20 cursor-text rounded-md border bg-transparent px-2 py-1 text-sm tabular-nums focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  <span className="text-sm text-muted-foreground">
                    {t("timeoutUnit")}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("timeoutDescription")}
                </p>
              </div>

              {/* Reset */}
              <button
                type="button"
                onClick={() => setDraft(CHAT_SETTINGS_DEFAULTS)}
                className="cursor-pointer self-start text-xs text-muted-foreground underline-offset-2 hover:underline disabled:pointer-events-none disabled:opacity-40"
                disabled={
                  draft.temperature === CHAT_SETTINGS_DEFAULTS.temperature &&
                  draft.timeoutMs === CHAT_SETTINGS_DEFAULTS.timeoutMs
                }
              >
                {t("reset")}
              </button>
            </div>

            <DialogFooter>
              <Button onClick={handleSave} className="cursor-pointer w-full">
                {t("save")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </header>
  );
}
