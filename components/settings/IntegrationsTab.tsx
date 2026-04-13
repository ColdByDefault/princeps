/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { IntegrationCard } from "./IntegrationCard";
import type { IntegrationInfo } from "./IntegrationCard";

// All providers the app supports — add new ones here as they are implemented
const ALL_PROVIDERS = ["google_calendar"] as const;

type IntegrationsTabProps = {
  initialIntegrations: IntegrationInfo[];
};

export function IntegrationsTab({ initialIntegrations }: IntegrationsTabProps) {
  const t = useTranslations("settings.integrations");
  const [integrations, setIntegrations] =
    useState<IntegrationInfo[]>(initialIntegrations);

  const getConnected = (provider: string): IntegrationInfo | null =>
    integrations.find((i) => i.provider === provider) ?? null;

  const handleDisconnected = (provider: string) => {
    setIntegrations((prev) => prev.filter((i) => i.provider !== provider));
  };

  const handleSynced = (provider: string, lastSyncedAt: string) => {
    setIntegrations((prev) =>
      prev.map((i) => (i.provider === provider ? { ...i, lastSyncedAt } : i)),
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium">{t("title")}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {t("description")}
        </p>
      </div>

      <div className="grid gap-3">
        {ALL_PROVIDERS.map((provider) => (
          <IntegrationCard
            key={provider}
            provider={provider}
            connected={getConnected(provider)}
            onDisconnected={handleDisconnected}
            onSynced={handleSynced}
          />
        ))}
      </div>
    </div>
  );
}
