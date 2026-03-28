/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getMessage } from "@/lib/i18n";
import { type MessageDictionary, type AppLanguage } from "@/types/i18n";
import { type UserPreferences, DEFAULT_PREFERENCES } from "@/types/settings";
import { useLanguage } from "@/hooks/use-language";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messages: MessageDictionary;
};

type SliderFieldProps = {
  label: string;
  description: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
};

function SliderField({
  label,
  description,
  value,
  min,
  max,
  step,
  onChange,
}: SliderFieldProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        <span className="text-xs font-mono text-muted-foreground tabular-nums w-12 text-right">
          {value}
        </span>
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="block w-full h-1.5 appearance-none rounded-full bg-border accent-primary cursor-pointer"
      />
      <div className="flex justify-between text-[10px] text-muted-foreground/60">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

export function SettingsDialog({ open, onOpenChange, messages }: Props) {
  const router = useRouter();
  const { language: clientLanguage, changeLanguage } = useLanguage();
  const [prefs, setPrefs] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data: { preferences: UserPreferences }) => {
        setPrefs(data.preferences);
      })
      .catch(() => {
        /* keep defaults */
      })
      .finally(() => setLoading(false));
  }, [open]);

  const setOpt = <K extends keyof UserPreferences["ollamaOptions"]>(
    key: K,
    val: UserPreferences["ollamaOptions"][K],
  ) => {
    setPrefs((p) => ({
      ...p,
      ollamaOptions: { ...p.ollamaOptions, [key]: val },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });
      if (!res.ok) throw new Error();

      // Sync cookie/localStorage so the full app UI reflects the saved language
      if (prefs.language !== clientLanguage) {
        changeLanguage(prefs.language);
        router.refresh();
      }

      toast.success(getMessage(messages, "settings.saved", "Settings saved"), {
        icon: <CheckCircle2 className="size-4 text-emerald-500" />,
      });
      onOpenChange(false);
    } catch {
      toast.error(
        getMessage(messages, "settings.saveError", "Failed to save settings"),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setPrefs(DEFAULT_PREFERENCES);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl overflow-x-clip">
        <DialogHeader>
          <DialogTitle>
            {getMessage(messages, "settings.title", "Settings")}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            {getMessage(messages, "settings.loading", "Loading…")}
          </div>
        ) : (
          <div className="min-w-0 max-h-[65vh] overflow-y-auto space-y-6 py-2 pr-8">
            {/* Language */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">
                {getMessage(messages, "settings.section.language", "Language")}
              </Label>
              <p className="text-xs text-muted-foreground">
                {getMessage(
                  messages,
                  "settings.language.description",
                  "Language used throughout the app and in assistant messages.",
                )}
              </p>
              <Select
                value={prefs.language}
                onValueChange={(v) =>
                  setPrefs((p) => ({ ...p, language: v as AppLanguage }))
                }
              >
                <SelectTrigger className="w-40 cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="de" className="cursor-pointer">
                    {getMessage(messages, "shell.language.de", "German")}
                  </SelectItem>
                  <SelectItem value="en" className="cursor-pointer">
                    {getMessage(messages, "shell.language.en", "English")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Assistant instructions */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">
                {getMessage(
                  messages,
                  "settings.section.assistant",
                  "Assistant",
                )}
              </Label>
              <p className="text-xs text-muted-foreground">
                {getMessage(
                  messages,
                  "settings.instructions.description",
                  "Custom instructions applied to every conversation.",
                )}
              </p>
              <Textarea
                rows={4}
                maxLength={2000}
                placeholder={getMessage(
                  messages,
                  "settings.instructions.placeholder",
                  "Always reply in bullet points. Focus on actionability.",
                )}
                value={prefs.assistantInstructions}
                onChange={(e) =>
                  setPrefs((p) => ({
                    ...p,
                    assistantInstructions: e.target.value,
                  }))
                }
              />
              <p className="text-right text-[10px] text-muted-foreground/60">
                {prefs.assistantInstructions.length}/2000
              </p>
            </div>

            <Separator />

            {/* Model options */}
            <div className="space-y-4">
              <Label className="text-sm font-semibold">
                {getMessage(
                  messages,
                  "settings.section.model",
                  "Model options",
                )}
              </Label>

              <SliderField
                label={getMessage(
                  messages,
                  "settings.model.temperature",
                  "Temperature",
                )}
                description={getMessage(
                  messages,
                  "settings.model.temperatureDesc",
                  "Controls randomness. Higher values produce more creative responses.",
                )}
                value={prefs.ollamaOptions.temperature}
                min={0}
                max={2}
                step={0.05}
                onChange={(v) => setOpt("temperature", v)}
              />

              <SliderField
                label={getMessage(messages, "settings.model.topP", "Top P")}
                description={getMessage(
                  messages,
                  "settings.model.topPDesc",
                  "Nucleus sampling. Lower values make output more focused.",
                )}
                value={prefs.ollamaOptions.top_p}
                min={0}
                max={1}
                step={0.05}
                onChange={(v) => setOpt("top_p", v)}
              />

              <SliderField
                label={getMessage(messages, "settings.model.topK", "Top K")}
                description={getMessage(
                  messages,
                  "settings.model.topKDesc",
                  "Limits the token pool per step. 0 disables the limit.",
                )}
                value={prefs.ollamaOptions.top_k}
                min={0}
                max={200}
                step={1}
                onChange={(v) => setOpt("top_k", Math.round(v))}
              />

              <SliderField
                label={getMessage(
                  messages,
                  "settings.model.numCtx",
                  "Context window",
                )}
                description={getMessage(
                  messages,
                  "settings.model.numCtxDesc",
                  "Number of tokens the model can process at once.",
                )}
                value={prefs.ollamaOptions.num_ctx}
                min={512}
                max={131072}
                step={512}
                onChange={(v) => setOpt("num_ctx", Math.round(v))}
              />

              <SliderField
                label={getMessage(
                  messages,
                  "settings.model.repeatPenalty",
                  "Repeat penalty",
                )}
                description={getMessage(
                  messages,
                  "settings.model.repeatPenaltyDesc",
                  "Penalizes repeated tokens. Higher values reduce repetition.",
                )}
                value={prefs.ollamaOptions.repeat_penalty}
                min={0.5}
                max={2}
                step={0.05}
                onChange={(v) => setOpt("repeat_penalty", v)}
              />
            </div>
          </div>
        )}

        <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            disabled={saving || loading}
            className="cursor-pointer"
          >
            {getMessage(
              messages,
              "settings.resetDefaults",
              "Reset to defaults",
            )}
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={saving}
              className="cursor-pointer"
            >
              {getMessage(messages, "shared.cancel", "Cancel")}
            </Button>
            <Button
              size="sm"
              onClick={() => void handleSave()}
              disabled={saving || loading}
              className="cursor-pointer"
            >
              {saving
                ? getMessage(messages, "settings.saving", "Saving…")
                : getMessage(messages, "settings.save", "Save")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
