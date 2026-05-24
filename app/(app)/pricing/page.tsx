/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.7
 * @since beta
 */

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations, getLocale, getMessages } from "@/lib/core/i18n";
import { auth } from "@/lib/core/auth/auth";
import { db } from "@/lib/core/db";
import { defineSEO, getSeoLocale } from "@/lib/core/seo";
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

  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={{ pricing: messages.pricing }}>
      <PricingShell currentTier={user.tier as Tier} />
    </NextIntlClientProvider>
  );
}
