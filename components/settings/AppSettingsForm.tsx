/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getMessage } from "@/lib/i18n";
import { type MessageDictionary, type AppLanguage } from "@/types/i18n";
import { type UserPreferences } from "@/types/settings";
import { useLanguage } from "@/hooks/use-language";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

type Props = {
  initialPreferences: UserPreferences;
  resolvedLanguage: AppLanguage;
  messages: MessageDictionary;
};

export function AppSettingsForm({
  initialPreferences: _initialPreferences,
  resolvedLanguage,
  messages,
}: Props) {
  const router = useRouter();
  const { language: clientLanguage, changeLanguage } = useLanguage();
  const [language, setLanguage] = useState<AppLanguage>(resolvedLanguage);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language }),
      });
      if (!res.ok) throw new Error();

      if (language !== clientLanguage) {
        changeLanguage(language);
        router.refresh();
      }

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

  return (
    <div className="space-y-8">
      {/* Language */}
      <div className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold">
            {getMessage(messages, "settings.section.language", "Language")}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {getMessage(
              messages,
              "settings.language.description",
              "Language used throughout the app and in assistant messages.",
            )}
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="app-language-select" className="text-sm">
            {getMessage(
              messages,
              "appSettings.language.label",
              "Display language",
            )}
          </Label>
          <Select
            value={language}
            onValueChange={(v) => setLanguage(v as AppLanguage)}
          >
            <SelectTrigger
              id="app-language-select"
              className="w-48 cursor-pointer"
            >
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
      </div>

      {/* Actions */}
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
