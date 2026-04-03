/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AppearanceTab } from "./AppearanceTab";
import { ProviderTab } from "./ProviderTab";
import type { ProviderStatusPayload } from "@/types/llm";

const COOKIE_KEY = "settings-tab";
const VALID_TABS = ["appearance", "provider"] as const;
type SettingsTab = (typeof VALID_TABS)[number];

function setTabCookie(tab: SettingsTab) {
  document.cookie = `${COOKIE_KEY}=${tab};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`;
}

type SettingsShellProps = {
  initialStatus: ProviderStatusPayload;
  initialTab: string;
};

export function SettingsShell({ initialStatus, initialTab }: SettingsShellProps) {
  const t = useTranslations("settings.tabs");
  const safeInitial: SettingsTab = VALID_TABS.includes(initialTab as SettingsTab)
    ? (initialTab as SettingsTab)
    : "appearance";
  const [activeTab, setActiveTab] = useState<SettingsTab>(safeInitial);

  const handleTabChange = (tab: string) => {
    const safe = VALID_TABS.includes(tab as SettingsTab) ? (tab as SettingsTab) : "appearance";
    setActiveTab(safe);
    setTabCookie(safe);
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="w-full">
        <TabsTrigger value="appearance" className="flex-1">
          {t("appearance")}
        </TabsTrigger>
        <TabsTrigger value="provider" className="flex-1">
          {t("provider")}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="appearance" className="mt-6 w-full">
        <AppearanceTab />
      </TabsContent>

      <TabsContent value="provider" className="mt-6 w-full">
        <ProviderTab initialStatus={initialStatus} />
      </TabsContent>
    </Tabs>
  );
}
