/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AppearanceTab } from "./AppearanceTab";
import { AssistantTab } from "./AssistantTab";
import { LabelsTab } from "./LabelsTab";
import { ProviderTab } from "./ProviderTab";
import { UsageTab } from "./UsageTab";
import type { ProviderStatusPayload } from "@/types/llm";
import type { UsageSummary } from "@/types/billing";
import type { LabelRecord } from "@/types/api";
import type {
  AssistantTone,
  AddressStyle,
  ResponseLength,
} from "@/lib/settings/user-preferences.logic";

const COOKIE_KEY = "settings-tab";
const VALID_TABS = [
  "appearance",
  "labels",
  "usage",
  "provider",
  "assistant",
] as const;
type SettingsTab = (typeof VALID_TABS)[number];

function setTabCookie(tab: SettingsTab) {
  document.cookie = `${COOKIE_KEY}=${tab};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`;
}

type SettingsShellProps = {
  initialStatus: ProviderStatusPayload;
  initialTab: string;
  initialUsage: UsageSummary;
  initialLabels: LabelRecord[];
  initialNotificationsEnabled: boolean;
  initialTimezone: string;
  initialLocation: string | null;
  initialAssistantName: string | null;
  initialAssistantTone: AssistantTone | null;
  initialAddressStyle: AddressStyle | null;
  initialResponseLength: ResponseLength | null;
};

export function SettingsShell({
  initialStatus,
  initialTab,
  initialUsage,
  initialLabels,
  initialNotificationsEnabled,
  initialTimezone,
  initialLocation,
  initialAssistantName,
  initialAssistantTone,
  initialAddressStyle,
  initialResponseLength,
}: SettingsShellProps) {
  const t = useTranslations("settings.tabs");
  const safeInitial: SettingsTab = VALID_TABS.includes(
    initialTab as SettingsTab,
  )
    ? (initialTab as SettingsTab)
    : "appearance";
  const [activeTab, setActiveTab] = useState<SettingsTab>(safeInitial);

  const handleTabChange = (tab: string) => {
    const safe = VALID_TABS.includes(tab as SettingsTab)
      ? (tab as SettingsTab)
      : "appearance";
    setActiveTab(safe);
    setTabCookie(safe);
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="w-full">
        <TabsTrigger value="appearance" className="flex-1">
          {t("appearance")}
        </TabsTrigger>
        <TabsTrigger value="assistant" className="flex-1">
          {t("assistant")}
        </TabsTrigger>
        <TabsTrigger value="labels" className="flex-1">
          {t("labels")}
        </TabsTrigger>
        <TabsTrigger value="usage" className="flex-1">
          {t("usage")}
        </TabsTrigger>
        <TabsTrigger value="provider" className="flex-1">
          {t("provider")}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="appearance" className="mt-6 w-full">
        <AppearanceTab
          initialNotificationsEnabled={initialNotificationsEnabled}
          initialTimezone={initialTimezone}
          initialLocation={initialLocation}
        />
      </TabsContent>

      <TabsContent value="labels" className="mt-6 w-full">
        <LabelsTab initialLabels={initialLabels} />
      </TabsContent>

      <TabsContent value="usage" className="mt-6 w-full">
        <UsageTab usage={initialUsage} />
      </TabsContent>

      <TabsContent value="provider" className="mt-6 w-full">
        <ProviderTab initialStatus={initialStatus} />
      </TabsContent>

      <TabsContent value="assistant" className="mt-6 w-full">
        <AssistantTab
          initialAssistantName={initialAssistantName}
          initialAssistantTone={initialAssistantTone}
          initialAddressStyle={initialAddressStyle}
          initialResponseLength={initialResponseLength}
        />
      </TabsContent>
    </Tabs>
  );
}
