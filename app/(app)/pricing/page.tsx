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
import { redirect } from "next/navigation";
import { getTranslations, getLocale } from "@/lib/i18n";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { defineSEO, getSeoLocale } from "@/lib/seo";
import { PricingShell } from "@/components/pricing";
import type { Tier } from "@/types/billing";
import type { AppLanguage } from "@/types/i18n";

export async function generateMetadata() {
  const t = await getTranslations("pricing");
  const locale = (await getLocale()) as AppLanguage;

  return defineSEO({
    title: t("metadata.title"),
    description: t("metadata.description"),
    path: "/pricing",
    locale: getSeoLocale(locale),
  });
}

export default async function PricingPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  const user = await db.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { tier: true },
  });

  return <PricingShell currentTier={user.tier as Tier} />;
}
