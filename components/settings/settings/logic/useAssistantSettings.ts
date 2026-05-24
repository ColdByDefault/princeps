/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.8
 * @since beta
 */

"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type {
  AssistantTone,
  AddressStyle,
  ResponseLength,
} from "@/lib/platform/settings/types";

type UseAssistantSettingsInput = {
  initialAssistantName: string | null;
  initialAssistantTone: AssistantTone | null;
  initialAddressStyle: AddressStyle | null;
  initialResponseLength: ResponseLength | null;
  initialCustomSystemPrompt: string | null;
  initialAutoBriefingEnabled: boolean;
  initialReportsEnabled: boolean;
  initialOverdueTaskNudgesEnabled: boolean;
};

export function useAssistantSettings(input: UseAssistantSettingsInput) {
  const t = useTranslations("settings.assistant");
  const [assistantName, setAssistantName] = useState(
    input.initialAssistantName ?? "",
  );
  const [assistantTone, setAssistantTone] = useState<AssistantTone | "">(
    input.initialAssistantTone ?? "",
  );
  const [addressStyle, setAddressStyle] = useState<AddressStyle | "">(
    input.initialAddressStyle ?? "",
  );
  const [responseLength, setResponseLength] = useState<ResponseLength | "">(
    input.initialResponseLength ?? "",
  );
  const [customPrompt, setCustomPrompt] = useState(
    input.initialCustomSystemPrompt ?? "",
  );
  const [showPreview, setShowPreview] = useState(false);
  const [autoBriefingEnabled, setAutoBriefingEnabled] = useState(
    input.initialAutoBriefingEnabled,
  );
  const [reportsEnabled, setReportsEnabled] = useState(
    input.initialReportsEnabled,
  );
  const [overdueTaskNudgesEnabled, setOverdueTaskNudgesEnabled] = useState(
    input.initialOverdueTaskNudgesEnabled,
  );
  const customPromptDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
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

  function handleCustomPromptChange(value: string) {
    setCustomPrompt(value);
    if (customPromptDebounceRef.current)
      clearTimeout(customPromptDebounceRef.current);
    customPromptDebounceRef.current = setTimeout(() => {
      void patchSetting(
        { customSystemPrompt: value.trim() || null },
        "customPromptSaved",
        "customPromptSaveFailed",
      );
    }, 1000);
  }

  async function handleAutoBriefingToggle(checked: boolean) {
    setAutoBriefingEnabled(checked);
    await patchSetting(
      { autoBriefingEnabled: checked },
      "autoBriefingSaved",
      "autoBriefingSaveFailed",
    );
  }

  async function handleReportsToggle(checked: boolean) {
    setReportsEnabled(checked);
    await patchSetting(
      { reportsEnabled: checked },
      "reportsSaved",
      "reportsSaveFailed",
    );
  }

  async function handleOverdueTaskNudgesToggle(checked: boolean) {
    setOverdueTaskNudgesEnabled(checked);
    await patchSetting(
      { overdueTaskNudgesEnabled: checked },
      "overdueTaskNudgesSaved",
      "overdueTaskNudgesSaveFailed",
    );
  }

  function handlePreviewToggle() {
    setShowPreview((current) => !current);
  }

  return {
    assistantName,
    assistantTone,
    addressStyle,
    responseLength,
    customPrompt,
    showPreview,
    autoBriefingEnabled,
    reportsEnabled,
    overdueTaskNudgesEnabled,
    handleNameChange,
    handleToneChange,
    handleAddressChange,
    handleLengthChange,
    handleCustomPromptChange,
    handleAutoBriefingToggle,
    handleReportsToggle,
    handleOverdueTaskNudgesToggle,
    handlePreviewToggle,
  };
}

