/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version beta
 * @since beta
 * @module
 * @description
 */

import { getTranslations } from "next-intl/server";
import { LoadingRing } from "@/components/shared";

function SkeletonBlock({ className }: { className: string }) {
  return (
    <div className={`animate-pulse rounded-2xl bg-muted/70 ${className}`} />
  );
}

export default async function Loading() {
  const t = await getTranslations("loading");

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col px-6 py-8 sm:px-8 lg:px-10">
      <div className="mb-6 flex justify-center">
        <LoadingRing message={t("generic")} />
      </div>

      <section className="rounded-[2rem] border border-border/70 bg-card/70 p-6 shadow-xl shadow-black/5 backdrop-blur lg:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-3">
            <SkeletonBlock className="h-4 w-36" />
            <SkeletonBlock className="h-8 w-72 max-w-full" />
          </div>
          <SkeletonBlock className="h-10 w-36 rounded-xl" />
        </div>

        <div className="mt-6 grid gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <article
              key={`loading-card-${index}`}
              className="rounded-[1.5rem] border border-border/70 bg-background/70 p-5"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="w-full space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <SkeletonBlock className="h-6 w-24 rounded-full" />
                    <SkeletonBlock className="h-4 w-40" />
                  </div>
                  <SkeletonBlock className="h-7 w-56 max-w-full" />
                  <div className="space-y-2">
                    <SkeletonBlock className="h-3 w-full" />
                    <SkeletonBlock className="h-3 w-[88%]" />
                  </div>
                </div>
                <SkeletonBlock className="h-10 w-32 rounded-xl" />
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
