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
import { Suspense } from "react";
import { LoginCard } from "@/components/auth";
import { getTranslations, getLocale } from "@/lib/i18n";
import { auth } from "@/lib/auth/auth";
import { defineSEO, getSeoLocale } from "@/lib/seo";
import { isSupportedLanguage, DEFAULT_LANGUAGE } from "@/types/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  const rawLocale = await getLocale();
  const locale = isSupportedLanguage(rawLocale) ? rawLocale : DEFAULT_LANGUAGE;

  return defineSEO({
    title: t("login.metadata.title"),
    description: t("login.metadata.description"),
    path: "/login",
    locale: getSeoLocale(locale),
  });
}

export default async function LoginPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) redirect("/home");

  return (
    <Suspense>
      <LoginCard />
    </Suspense>
  );
}
