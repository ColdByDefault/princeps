/**
 * @author ColdByDefault
 * @copyright  2026 ColdByDefault. All Rights Reserved.
 */

import { type Metadata } from "next";
import { SignUpCard } from "@/components/auth";
import { getTranslations, getLocale } from "@/lib/i18n";
import { defineSEO, getSeoLocale } from "@/lib/seo";
import { isSupportedLanguage, DEFAULT_LANGUAGE } from "@/types/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  const rawLocale = await getLocale();
  const locale = isSupportedLanguage(rawLocale) ? rawLocale : DEFAULT_LANGUAGE;

  return defineSEO({
    title: t("signUp.metadata.title"),
    description: t("signUp.metadata.description"),
    path: "/sign-up",
    locale: getSeoLocale(locale),
  });
}

export default function SignUpPage() {
  return <SignUpCard />;
}
