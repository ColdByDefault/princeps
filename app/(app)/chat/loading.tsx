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
    <div className="flex h-full flex-col px-4 py-6 sm:px-6">
      <div className="flex justify-center mb-8">
        <LoadingRing message={t("chat")} />
      </div>

      <div className="flex flex-1 flex-col gap-5 overflow-hidden">
        <div className="flex justify-start">
          <SkeletonBlock className="h-16 w-[55%] rounded-2xl" />
        </div>
        <div className="flex justify-end">
          <SkeletonBlock className="h-10 w-[40%] rounded-2xl" />
        </div>
        <div className="flex justify-start">
          <SkeletonBlock className="h-20 w-[62%] rounded-2xl" />
        </div>
        <div className="flex justify-end">
          <SkeletonBlock className="h-10 w-[35%] rounded-2xl" />
        </div>
        <div className="flex justify-start">
          <SkeletonBlock className="h-14 w-[50%] rounded-2xl" />
        </div>
      </div>

      <div className="mt-6">
        <SkeletonBlock className="h-14 w-full rounded-2xl" />
      </div>
    </div>
  );
}
