/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations, getLocale } from "@/lib/i18n";
import { auth } from "@/lib/auth";
import { defineSEO, getSeoLocale } from "@/lib/seo";
import type { AppLanguage } from "@/types/i18n";

export async function generateMetadata() {
  const t = await getTranslations("home");
  const locale = (await getLocale()) as AppLanguage;

  return defineSEO({
    title: t("metadata.title"),
    description: t("metadata.description"),
    path: "/home",
    locale: getSeoLocale(locale),
  });
}

export default async function HomePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const t = await getTranslations("home");

  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center px-6 py-16">
      <p className="text-lg text-muted-foreground">{t("welcome")}</p>
    </div>
  );
}
