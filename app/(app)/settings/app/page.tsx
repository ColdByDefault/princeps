/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import { getRequestConfig } from "@/i18n/request";
import { auth } from "@/lib/auth";
import { getMessage } from "@/lib/i18n";
import { listLabels } from "@/lib/labels/list.logic";
import { getUserPreferences } from "@/lib/settings/get.logic";
import { getActiveShareToken } from "@/lib/share/get.logic";
import {
  AppSettingsForm,
  IntegrationsTab,
  LabelsSection,
  ScheduledNotificationsSection,
  ShareLinkPanel,
} from "@/components/settings";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const { messages } = await getRequestConfig();
  return {
    title: getMessage(messages, "appSettings.metadata.title", "App Settings"),
    description: getMessage(
      messages,
      "appSettings.metadata.description",
      "Global application settings.",
    ),
  };
}

export default async function AppSettingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  const { messages, language } = await getRequestConfig();
  const preferences = await getUserPreferences(session.user.id);
  const labels = await listLabels(session.user.id);
  const activeToken = await getActiveShareToken(session.user.id);
  const sp = await searchParams;
  const oauthSuccess =
    typeof sp["success"] === "string" ? sp["success"] : undefined;
  const oauthError = typeof sp["error"] === "string" ? sp["error"] : undefined;

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-8 sm:px-8">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl border border-border/70 bg-card/70 shadow-sm">
          <SlidersHorizontal className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-semibold leading-none">
            {getMessage(messages, "appSettings.page.title", "App Settings")}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {getMessage(
              messages,
              "appSettings.page.subtitle",
              "Global application configuration.",
            )}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-border/70 bg-card/70 p-6 shadow-sm backdrop-blur">
        <AppSettingsForm
          initialPreferences={preferences}
          resolvedLanguage={language}
          messages={messages}
        />
      </div>

      <div className="mt-6 rounded-2xl border border-border/70 bg-card/70 p-6 shadow-sm backdrop-blur">
        <LabelsSection initialLabels={labels} messages={messages} />
      </div>

      <div className="mt-6 rounded-2xl border border-border/70 bg-card/70 p-6 shadow-sm backdrop-blur">
        <ShareLinkPanel
          messages={messages}
          initialToken={
            activeToken
              ? {
                  id: activeToken.id,
                  fields: activeToken.fields,
                  expiresAt: activeToken.expiresAt.toISOString(),
                }
              : null
          }
        />
      </div>

      <div className="mt-6 rounded-2xl border border-border/70 bg-card/70 p-6 shadow-sm backdrop-blur">
        <ScheduledNotificationsSection
          initialPrefs={preferences.scheduledNotifications}
          messages={messages}
        />
      </div>

      <div className="mt-6 rounded-2xl border border-border/70 bg-card/70 p-6 shadow-sm backdrop-blur">
        <IntegrationsTab
          messages={messages}
          oauthSuccess={oauthSuccess}
          oauthError={oauthError}
        />
      </div>
    </div>
  );
}
