/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version beta
 * @since beta
 * @module
 * @description
 */

import { headers } from "next/headers";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations, getLocale } from "@/lib/i18n";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { defineSEO, getSeoLocale } from "@/lib/seo";
import {
  getProviderStatus,
  getUserUsage,
  getUserPreferences,
} from "@/lib/settings";
import { TOOL_REGISTRY } from "@/lib/tools";
import { SettingsShell } from "@/components/settings";
import type { AppLanguage } from "@/types/i18n";
import type { Tier } from "@/types/billing";

export async function generateMetadata() {
  const t = await getTranslations("settings");
  const locale = (await getLocale()) as AppLanguage;

  return defineSEO({
    title: t("metadata.title"),
    description: t("metadata.description"),
    path: "/settings",
    locale: getSeoLocale(locale),
  });
}

export default async function SettingsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const [initialStatus, initialUsage, initialPrefs, userRow, integrationRows] =
    await Promise.all([
      getProviderStatus(),
      getUserUsage(session.user.id),
      getUserPreferences(session.user.id),
      db.user.findUnique({
        where: { id: session.user.id },
        select: { timezone: true, tier: true },
      }),
      db.integration.findMany({
        where: { userId: session.user.id },
        select: {
          provider: true,
          lastSyncedAt: true,
          expiresAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
      }),
    ]);
  const cookieStore = await cookies();
  const initialTab = cookieStore.get("settings-tab")?.value ?? "appearance";

  const allTools = TOOL_REGISTRY.map(({ function: fn, minTier, group }) => ({
    name: fn.name,
    minTier,
    group,
  }));

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <SettingsShell
        initialStatus={initialStatus}
        initialTab={initialTab}
        initialUsage={initialUsage}
        initialNotificationsEnabled={initialPrefs.notificationsEnabled ?? true}
        initialTimezone={userRow?.timezone ?? "UTC"}
        initialLocation={initialPrefs.location ?? null}
        initialAssistantName={initialPrefs.assistantName ?? null}
        initialAssistantTone={initialPrefs.assistantTone ?? null}
        initialAddressStyle={initialPrefs.addressStyle ?? null}
        initialResponseLength={initialPrefs.responseLength ?? null}
        initialCustomSystemPrompt={initialPrefs.customSystemPrompt ?? null}
        initialAutoBriefingEnabled={initialPrefs.autoBriefingEnabled ?? true}
        initialReportsEnabled={initialPrefs.reportsEnabled ?? true}
        initialDisabledTools={initialPrefs.disabledTools}
        allTools={allTools}
        currentTier={(userRow?.tier ?? "free") as Tier}
        appOrigin={process.env.BETTER_AUTH_URL ?? "http://localhost:3000"}
        initialIntegrations={integrationRows.map((r) => ({
          provider: r.provider,
          lastSyncedAt: r.lastSyncedAt?.toISOString() ?? null,
          expiresAt: r.expiresAt?.toISOString() ?? null,
          createdAt: r.createdAt.toISOString(),
        }))}
        priceIds={{
          proMonthly: process.env.STRIPE_PRICE_PRO_MONTHLY ?? "",
          proAnnual: process.env.STRIPE_PRICE_PRO_ANNUAL ?? "",
          premiumMonthly: process.env.STRIPE_PRICE_PREMIUM_MONTHLY ?? "",
          premiumAnnual: process.env.STRIPE_PRICE_PREMIUM_ANNUAL ?? "",
        }}
      />
    </div>
  );
}
