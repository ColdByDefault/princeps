/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
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
    <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
      <div className="flex justify-center mb-8">
        <LoadingRing message={t("settings")} />
      </div>

      <section className="rounded-[2rem] border border-border/70 bg-card/70 p-6 shadow-xl shadow-black/5 backdrop-blur">
        <div className="flex gap-2 rounded-xl bg-muted/50 p-1 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonBlock key={`tab-${i}`} className="h-8 flex-1 rounded-lg" />
          ))}
        </div>

        <div className="space-y-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={`row-${i}`}
              className="rounded-[1.5rem] border border-border/70 bg-background/70 p-5 space-y-3"
            >
              <SkeletonBlock className="h-4 w-32" />
              <SkeletonBlock className="h-10 w-full rounded-xl" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
