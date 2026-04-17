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
import { ProviderTab } from "./ProviderTab";
import { ToolsTab } from "./ToolsTab";
import { UsageTab } from "./UsageTab";
import { SubscriptionTab } from "./SubscriptionTab";
import { IntegrationsTab } from "./IntegrationsTab";
import type { IntegrationInfo } from "./IntegrationCard";
import type { ProviderStatusPayload } from "@/types/llm";
import type { UsageSummary } from "@/types/billing";
import type { ToolDisplayEntry } from "@/types/api";
import type { Tier } from "@/types/billing";
import type {
  AssistantTone,
  AddressStyle,
  ResponseLength,
} from "@/lib/settings/types";

const COOKIE_KEY = "settings-tab";
const VALID_TABS = [
  "appearance",
  "assistant",
  "tools",
  "usage",
  "provider",
  "integrations",
  "subscription",
] as const;
type SettingsTab = (typeof VALID_TABS)[number];

function setTabCookie(tab: SettingsTab) {
  document.cookie = `${COOKIE_KEY}=${tab};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`;
}

type SettingsShellProps = {
  initialStatus: ProviderStatusPayload;
  initialTab: string;
  initialUsage: UsageSummary;
  initialNotificationsEnabled: boolean;
  initialTimezone: string;
  initialLocation: string | null;
  initialAssistantName: string | null;
  initialAssistantTone: AssistantTone | null;
  initialAddressStyle: AddressStyle | null;
  initialResponseLength: ResponseLength | null;
  initialCustomSystemPrompt: string | null;
  initialAutoBriefingEnabled: boolean;
  initialReportsEnabled: boolean;
  initialDisabledTools: string[];
  allTools: ToolDisplayEntry[];
  currentTier: Tier;
  appOrigin: string;
  initialIntegrations: IntegrationInfo[];
  priceIds: {
    proMonthly: string;
    proAnnual: string;
    premiumMonthly: string;
    premiumAnnual: string;
  };
};

export function SettingsShell({
  initialStatus,
  initialTab,
  initialUsage,
  initialNotificationsEnabled,
  initialTimezone,
  initialLocation,
  initialAssistantName,
  initialAssistantTone,
  initialAddressStyle,
  initialResponseLength,
  initialCustomSystemPrompt,
  initialAutoBriefingEnabled,
  initialReportsEnabled,
  initialDisabledTools,
  allTools,
  currentTier,
  appOrigin,
  initialIntegrations,
  priceIds,
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
      <TabsList className="w-full h-auto! flex-wrap gap-y-1">
        <TabsTrigger value="appearance">{t("appearance")}</TabsTrigger>
        <TabsTrigger value="assistant">{t("assistant")}</TabsTrigger>
        <TabsTrigger value="tools">{t("tools")}</TabsTrigger>
        <TabsTrigger value="usage">{t("usage")}</TabsTrigger>
        <TabsTrigger value="provider">{t("provider")}</TabsTrigger>
        <TabsTrigger value="integrations">{t("integrations")}</TabsTrigger>
        <TabsTrigger value="subscription">{t("subscription")}</TabsTrigger>
      </TabsList>

      <TabsContent
        keepMounted
        value="appearance"
        className="mt-6 w-full data-hidden:hidden"
      >
        <AppearanceTab
          initialNotificationsEnabled={initialNotificationsEnabled}
          initialTimezone={initialTimezone}
          initialLocation={initialLocation}
        />
      </TabsContent>

      <TabsContent
        keepMounted
        value="usage"
        className="mt-6 w-full data-hidden:hidden"
      >
        <UsageTab usage={initialUsage} />
      </TabsContent>

      <TabsContent
        keepMounted
        value="provider"
        className="mt-6 w-full data-hidden:hidden"
      >
        <ProviderTab initialStatus={initialStatus} />
      </TabsContent>

      <TabsContent
        keepMounted
        value="assistant"
        className="mt-6 w-full data-hidden:hidden"
      >
        <AssistantTab
          initialAssistantName={initialAssistantName}
          initialAssistantTone={initialAssistantTone}
          initialAddressStyle={initialAddressStyle}
          initialResponseLength={initialResponseLength}
          initialCustomSystemPrompt={initialCustomSystemPrompt}
          initialAutoBriefingEnabled={initialAutoBriefingEnabled}
          initialReportsEnabled={initialReportsEnabled}
        />
      </TabsContent>

      <TabsContent
        keepMounted
        value="tools"
        className="mt-6 w-full data-hidden:hidden"
      >
        <ToolsTab
          tier={initialUsage.tier}
          allTools={allTools}
          initialDisabledTools={initialDisabledTools}
        />
      </TabsContent>

      <TabsContent
        keepMounted
        value="integrations"
        className="mt-6 w-full data-hidden:hidden"
      >
        <IntegrationsTab initialIntegrations={initialIntegrations} />
      </TabsContent>

      <TabsContent
        keepMounted
        value="subscription"
        className="mt-6 w-full data-hidden:hidden"
      >
        <SubscriptionTab
          currentTier={currentTier}
          appOrigin={appOrigin}
          priceIds={priceIds}
        />
      </TabsContent>
    </Tabs>
  );
}
