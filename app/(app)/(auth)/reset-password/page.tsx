/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * SPDX-License-Identifier: Elastic-2.0
 */

import { type Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ResetPasswordCard } from "@/components/auth";
import { getTranslations, getLocale } from "@/lib/i18n";
import { auth } from "@/lib/auth/auth";
import { defineSEO, getSeoLocale } from "@/lib/seo";
import { isSupportedLanguage, DEFAULT_LANGUAGE } from "@/types/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  const rawLocale = await getLocale();
  const locale = isSupportedLanguage(rawLocale) ? rawLocale : DEFAULT_LANGUAGE;

  return defineSEO({
    title: t("resetPassword.metadata.title"),
    description: t("resetPassword.metadata.description"),
    path: "/reset-password",
    locale: getSeoLocale(locale),
  });
}

export default async function ResetPasswordPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) redirect("/home");

  return (
    <Suspense>
      <ResetPasswordCard />
    </Suspense>
  );
}
