/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import { useTranslations } from "next-intl";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AppearanceTab } from "./AppearanceTab";
import { ProviderTab } from "./ProviderTab";
import type { ProviderStatusPayload } from "@/types/llm";

type SettingsShellProps = {
  initialStatus: ProviderStatusPayload;
};

export function SettingsShell({ initialStatus }: SettingsShellProps) {
  const t = useTranslations("settings.tabs");

  return (
    <Tabs defaultValue="appearance" className="w-full">
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
