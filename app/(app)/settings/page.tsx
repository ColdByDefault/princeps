/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations, getLocale } from "@/lib/i18n";
import { auth } from "@/lib/auth/auth";
import { defineSEO, getSeoLocale } from "@/lib/seo";
import { getProviderStatus } from "@/lib/settings/provider-status.logic";
import { getUserUsage } from "@/lib/settings/usage.logic";
import { SettingsShell } from "@/components/settings";
import type { AppLanguage } from "@/types/i18n";

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

  const [initialStatus, initialUsage] = await Promise.all([
    getProviderStatus(),
    getUserUsage(session.user.id),
  ]);
  const cookieStore = await cookies();
  const initialTab = cookieStore.get("settings-tab")?.value ?? "appearance";

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
      <SettingsShell
        initialStatus={initialStatus}
        initialTab={initialTab}
        initialUsage={initialUsage}
      />
    </div>
  );
}
