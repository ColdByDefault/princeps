/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  AssistantTone,
  AddressStyle,
  ResponseLength,
} from "@/lib/settings/user-preferences.logic";

type AssistantTabProps = {
  initialAssistantName: string | null;
  initialAssistantTone: AssistantTone | null;
  initialAddressStyle: AddressStyle | null;
  initialResponseLength: ResponseLength | null;
};

export function AssistantTab({
  initialAssistantName,
  initialAssistantTone,
  initialAddressStyle,
  initialResponseLength,
}: AssistantTabProps) {
  const t = useTranslations("settings.assistant");

  const [assistantName, setAssistantName] = useState(
    initialAssistantName ?? "",
  );
  const [assistantTone, setAssistantTone] = useState<AssistantTone | "">(
    initialAssistantTone ?? "",
  );
  const [addressStyle, setAddressStyle] = useState<AddressStyle | "">(
    initialAddressStyle ?? "",
  );
  const [responseLength, setResponseLength] = useState<ResponseLength | "">(
    initialResponseLength ?? "",
  );

  const nameDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function patchSetting(
    patch: Record<string, unknown>,
    successKey: string,
    failKey: string,
  ) {
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        toast.error(t(failKey));
      } else {
        toast.success(t(successKey));
      }
    } catch {
      toast.error(t(failKey));
    }
  }

  function handleNameChange(value: string) {
    setAssistantName(value);
    if (nameDebounceRef.current) clearTimeout(nameDebounceRef.current);
    nameDebounceRef.current = setTimeout(() => {
      void patchSetting(
        { assistantName: value.trim() || null },
        "nameSaved",
        "nameSaveFailed",
      );
    }, 800);
  }

  async function handleToneChange(value: string | null) {
    if (!value) return;
    setAssistantTone(value as AssistantTone);
    await patchSetting({ assistantTone: value }, "toneSaved", "toneSaveFailed");
  }

  async function handleAddressChange(value: string | null) {
    if (!value) return;
    setAddressStyle(value as AddressStyle);
    await patchSetting(
      { addressStyle: value },
      "addressSaved",
      "addressSaveFailed",
    );
  }

  async function handleLengthChange(value: string | null) {
    if (!value) return;
    setResponseLength(value as ResponseLength);
    await patchSetting(
      { responseLength: value },
      "lengthSaved",
      "lengthSaveFailed",
    );
  }

  return (
    <div className="divide-y divide-border/60">
      {/* Assistant Name */}
      <div className="flex items-center justify-between gap-4 py-4">
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="text-sm font-medium">{t("nameTitle")}</p>
          <p className="text-sm text-muted-foreground">
            {t("nameDescription")}
          </p>
        </div>
        <div className="w-44 shrink-0">
          <Input
            value={assistantName}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder={t("namePlaceholder")}
            maxLength={32}
            aria-label={t("nameTitle")}
          />
        </div>
      </div>

      {/* Personality & Tone */}
      <div className="flex items-center justify-between gap-4 py-4">
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="text-sm font-medium">{t("toneTitle")}</p>
          <p className="text-sm text-muted-foreground">
            {t("toneDescription")}
          </p>
        </div>
        <div className="w-44 shrink-0">
          <Select value={assistantTone} onValueChange={handleToneChange}>
            <SelectTrigger
              className="w-full cursor-pointer"
              aria-label={t("toneTitle")}
            >
              <SelectValue placeholder={t("toneSelectPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="professional" className="cursor-pointer">
                  {t("toneProfessional")}
                </SelectItem>
                <SelectItem value="friendly" className="cursor-pointer">
                  {t("toneFriendly")}
                </SelectItem>
                <SelectItem value="casual" className="cursor-pointer">
                  {t("toneCasual")}
                </SelectItem>
                <SelectItem value="witty" className="cursor-pointer">
                  {t("toneWitty")}
                </SelectItem>
                <SelectItem value="motivational" className="cursor-pointer">
                  {t("toneMotivational")}
                </SelectItem>
                <SelectItem value="concise" className="cursor-pointer">
                  {t("toneConcise")}
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Address Style */}
      <div className="flex items-center justify-between gap-4 py-4">
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="text-sm font-medium">{t("addressTitle")}</p>
          <p className="text-sm text-muted-foreground">
            {t("addressDescription")}
          </p>
        </div>
        <div className="w-44 shrink-0">
          <Select value={addressStyle} onValueChange={handleAddressChange}>
            <SelectTrigger
              className="w-full cursor-pointer"
              aria-label={t("addressTitle")}
            >
              <SelectValue placeholder={t("addressSelectPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="firstname" className="cursor-pointer">
                  {t("addressFirstname")}
                </SelectItem>
                <SelectItem value="formal_male" className="cursor-pointer">
                  {t("addressFormalMale")}
                </SelectItem>
                <SelectItem value="formal_female" className="cursor-pointer">
                  {t("addressFormalFemale")}
                </SelectItem>
                <SelectItem value="informal" className="cursor-pointer">
                  {t("addressInformal")}
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Response Length */}
      <div className="flex items-center justify-between gap-4 py-4">
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="text-sm font-medium">{t("lengthTitle")}</p>
          <p className="text-sm text-muted-foreground">
            {t("lengthDescription")}
          </p>
        </div>
        <div className="w-44 shrink-0">
          <Select value={responseLength} onValueChange={handleLengthChange}>
            <SelectTrigger
              className="w-full cursor-pointer"
              aria-label={t("lengthTitle")}
            >
              <SelectValue placeholder={t("lengthSelectPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="brief" className="cursor-pointer">
                  {t("lengthBrief")}
                </SelectItem>
                <SelectItem value="balanced" className="cursor-pointer">
                  {t("lengthBalanced")}
                </SelectItem>
                <SelectItem value="detailed" className="cursor-pointer">
                  {t("lengthDetailed")}
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Proactivity Level — Coming Soon */}
      <div className="flex items-center justify-between gap-4 py-4 opacity-60">
        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">{t("proactivityTitle")}</p>
            <Badge variant="secondary" className="text-xs">
              {t("comingSoon")}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {t("proactivityDescription")}
          </p>
        </div>
        <div className="flex w-44 shrink-0 items-center justify-end gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <div
              key={n}
              className="h-2 w-2 rounded-full bg-muted-foreground/30"
              aria-hidden="true"
            />
          ))}
        </div>
      </div>

      {/* Re-login notice */}
      <p className="pt-4 text-xs text-muted-foreground">{t("reloginNotice")}</p>
    </div>
  );
}
