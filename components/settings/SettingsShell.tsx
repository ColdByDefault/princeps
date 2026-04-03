/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import { useTranslations } from "next-intl";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { AppearanceTab } from "./AppearanceTab";
import { ProviderTab } from "./ProviderTab";
import type { ProviderStatusPayload } from "@/types/llm";

type SettingsShellProps = {
  initialStatus: ProviderStatusPayload;
};

export function SettingsShell({ initialStatus }: SettingsShellProps) {
  const t = useTranslations("settings.tabs");

  return (
    <Tabs defaultValue="appearance">
      <TabsList>
        <TabsTrigger value="appearance">{t("appearance")}</TabsTrigger>
        <TabsTrigger value="provider">{t("provider")}</TabsTrigger>
      </TabsList>

      <TabsContent value="appearance" className="mt-6">
        <AppearanceTab />
      </TabsContent>

      <TabsContent value="provider" className="mt-6">
        <ProviderTab initialStatus={initialStatus} />
      </TabsContent>
    </Tabs>
  );
}
