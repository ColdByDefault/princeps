/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { type MessageDictionary } from "@/types/i18n";
import {
  type UserPreferences,
  type ResponseStyle,
  DEFAULT_PREFERENCES,
} from "@/types/settings";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

type Props = {
  initialPreferences: UserPreferences;
  messages: MessageDictionary;
};

export function AssistantSettingsForm({ initialPreferences, messages }: Props) {
  const [prefs, setPrefs] = useState<UserPreferences>(initialPreferences);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assistantName: prefs.assistantName,
          systemPrompt: prefs.systemPrompt,
          responseStyle: prefs.responseStyle,
        }),
      });
      if (!res.ok) throw new Error();

      toast.success(getMessage(messages, "settings.saved", "Settings saved"), {
        icon: <CheckCircle2 className="size-4 text-emerald-500" />,
      });
    } catch {
      toast.error(
        getMessage(messages, "settings.saveError", "Failed to save settings"),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setPrefs((p) => ({
      ...p,
      assistantName: DEFAULT_PREFERENCES.assistantName,
      systemPrompt: DEFAULT_PREFERENCES.systemPrompt,
      responseStyle: DEFAULT_PREFERENCES.responseStyle,
    }));
  };

  return (
    <div className="space-y-8">
      {/* Identity */}
      <div className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold">
            {getMessage(messages, "assistant.section.identity", "Identity")}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {getMessage(
              messages,
              "assistant.identity.description",
              "Name the assistant will use in every conversation.",
            )}
          </p>
        </div>

        {/* Assistant name */}
        <div className="space-y-1.5">
          <Label htmlFor="assistant-name" className="text-sm">
            {getMessage(messages, "assistant.name.label", "Assistant name")}
          </Label>
          <Input
            id="assistant-name"
            maxLength={30}
            placeholder={getMessage(
              messages,
              "assistant.name.placeholder",
              "Atlas",
            )}
            value={prefs.assistantName}
            onChange={(e) =>
              setPrefs((p) => ({ ...p, assistantName: e.target.value }))
            }
          />
          <p className="text-right text-[10px] text-muted-foreground/60">
            {prefs.assistantName.length}/30
          </p>
        </div>
      </div>

      <Separator />

      {/* Behavior */}
      <div className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold">
            {getMessage(messages, "assistant.section.behavior", "Behavior")}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {getMessage(
              messages,
              "assistant.behavior.description",
              "Define how the assistant communicates and responds.",
            )}
          </p>
        </div>

        {/* Response style */}
        <div className="space-y-1.5">
          <Label htmlFor="response-style" className="text-sm">
            {getMessage(
              messages,
              "assistant.responseStyle.label",
              "Response style",
            )}
          </Label>
          <p className="text-xs text-muted-foreground">
            {getMessage(
              messages,
              "assistant.responseStyle.description",
              "Sets the default tone and length of assistant responses.",
            )}
          </p>
          <Select
            value={prefs.responseStyle}
            onValueChange={(v) =>
              setPrefs((p) => ({ ...p, responseStyle: v as ResponseStyle }))
            }
          >
            <SelectTrigger id="response-style" className="w-48 cursor-pointer">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="concise" className="cursor-pointer">
                {getMessage(
                  messages,
                  "assistant.responseStyle.concise",
                  "Concise",
                )}
              </SelectItem>
              <SelectItem value="detailed" className="cursor-pointer">
                {getMessage(
                  messages,
                  "assistant.responseStyle.detailed",
                  "Detailed",
                )}
              </SelectItem>
              <SelectItem value="formal" className="cursor-pointer">
                {getMessage(
                  messages,
                  "assistant.responseStyle.formal",
                  "Formal",
                )}
              </SelectItem>
              <SelectItem value="casual" className="cursor-pointer">
                {getMessage(
                  messages,
                  "assistant.responseStyle.casual",
                  "Casual",
                )}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* System prompt */}
        <div className="space-y-1.5">
          <Label htmlFor="system-prompt" className="text-sm">
            {getMessage(
              messages,
              "assistant.systemPrompt.label",
              "System prompt",
            )}
          </Label>
          <p className="text-xs text-muted-foreground">
            {getMessage(
              messages,
              "assistant.systemPrompt.description",
              "Standing instructions the assistant follows in every conversation.",
            )}
          </p>
          <Textarea
            id="system-prompt"
            rows={5}
            maxLength={2000}
            placeholder={getMessage(
              messages,
              "assistant.systemPrompt.placeholder",
              "Always reply in bullet points. Prioritize brevity over completeness.",
            )}
            value={prefs.systemPrompt}
            onChange={(e) =>
              setPrefs((p) => ({ ...p, systemPrompt: e.target.value }))
            }
          />
          <p className="text-right text-[10px] text-muted-foreground/60">
            {prefs.systemPrompt.length}/2000
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          disabled={saving}
          className="cursor-pointer"
        >
          {getMessage(messages, "settings.resetDefaults", "Reset to defaults")}
        </Button>
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
