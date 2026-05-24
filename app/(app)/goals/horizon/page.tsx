/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.8
 * @since canary-v1.1.4
 */

import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Layers } from "lucide-react";
import { getTranslations, getLocale } from "@/lib/core/i18n";
import { auth } from "@/lib/core/auth/auth";
import { defineSEO, getSeoLocale } from "@/lib/core/seo";
import { listGoals, bucketGoalsByHorizon } from "@/lib/features/goals";
import { HorizonView } from "@/components/features/goals";
import { cn } from "@/lib/core/utils";
import type { AppLanguage } from "@/types/i18n";

export async function generateMetadata() {
  const t = await getTranslations("goals.horizon");
  const locale = (await getLocale()) as AppLanguage;
  return defineSEO({
    title: t("metadata.title"),
    description: t("metadata.description"),
    path: "/goals/horizon",
    locale: getSeoLocale(locale),
  });
}

export default async function HorizonPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const goals = await listGoals(session.user.id);
  const buckets = bucketGoalsByHorizon(goals);

  const t = await getTranslations("goals.horizon");

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/goals"
            aria-label={t("backToGoals")}
            className={cn(
              "inline-flex items-center justify-center rounded-lg",
              "size-8 cursor-pointer text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
            )}
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-muted-foreground" />
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                {t("pageTitle")}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t("pageDescription")}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{t("totalGoals", { count: goals.length })}</span>
        </div>
      </div>

      <HorizonView buckets={buckets} />
    </div>
  );
}


