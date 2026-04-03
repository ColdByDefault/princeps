/**
 * @author ColdByDefault
 * @copyright  2026 ColdByDefault. All Rights Reserved.
 */

import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations, getLocale } from "@/lib/i18n";
import { auth } from "@/lib/auth/auth";
import { defineSEO, getSeoLocale } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import type { AppLanguage } from "@/types/i18n";

export async function generateMetadata() {
  const t = await getTranslations("landing");
  const locale = (await getLocale()) as AppLanguage;

  return defineSEO({
    title: t("metadata.title"),
    description: t("metadata.description"),
    path: "/",
    locale: getSeoLocale(locale),
  });
}

export default async function LandingPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    redirect("/home");
  }

  const t = await getTranslations("landing");

  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="flex flex-col items-center gap-6 text-center">
        <p className="text-sm font-semibold tracking-[0.24em] text-primary uppercase">
          {t("brandName")}
        </p>
        <p className="text-lg text-muted-foreground">{t("tagline")}</p>

        <div className="mt-4 flex items-center gap-3">
          <Button
            size="lg"
            variant="outline"
            className="cursor-pointer rounded-xl px-5"
            nativeButton={false}
            render={<Link href="/login" />}
          >
            {t("login")}
          </Button>
          <Button
            size="lg"
            className="cursor-pointer rounded-xl px-5"
            nativeButton={false}
            render={<Link href="/sign-up" />}
          >
            {t("signUp")}
          </Button>
        </div>
      </div>
    </div>
  );
}
