/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version beta
 * @since beta
 * @module
 * @description
 */

import { type Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations, getLocale } from "@/lib/i18n";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { defineSEO, getSeoLocale } from "@/lib/seo";
import { PlanPickerShell } from "@/components/onboarding";
import { isSupportedLanguage, DEFAULT_LANGUAGE } from "@/types/i18n";
import type { AppLanguage } from "@/types/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("onboarding.plan");
  const rawLocale = await getLocale();
  const locale = isSupportedLanguage(rawLocale) ? rawLocale : DEFAULT_LANGUAGE;

  return defineSEO({
    title: t("metadata.title"),
    description: t("metadata.description"),
    path: "/onboarding/plan",
    locale: getSeoLocale(locale as AppLanguage),
  });
}

export default async function OnboardingPlanPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  // If user already has a paid plan, skip this step
  const user = await db.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { tier: true },
  });
  if (user.tier !== "free") redirect("/home");

  const appOrigin = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

  const priceIds = {
    proMonthly: process.env.STRIPE_PRICE_PRO_MONTHLY ?? "",
    proAnnual: process.env.STRIPE_PRICE_PRO_ANNUAL ?? "",
    premiumMonthly: process.env.STRIPE_PRICE_PREMIUM_MONTHLY ?? "",
    premiumAnnual: process.env.STRIPE_PRICE_PREMIUM_ANNUAL ?? "",
  };

  return (
    <PlanPickerShell
      successPath="/onboarding/success"
      cancelPath="/onboarding/plan"
      appOrigin={appOrigin}
      priceIds={priceIds}
    />
  );
}
