/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations, getLocale } from "@/lib/i18n";
import { auth } from "@/lib/auth/auth";
import { defineSEO, getSeoLocale } from "@/lib/seo";
import { listGoals } from "@/lib/goals/list.logic";
import { listLabels } from "@/lib/labels/list.logic";
import { listTasks } from "@/lib/tasks/list.logic";
import { GoalsShell } from "@/components/goals";
import type { AppLanguage } from "@/types/i18n";

export async function generateMetadata() {
  const t = await getTranslations("goals");
  const locale = (await getLocale()) as AppLanguage;
  return defineSEO({
    title: t("metadata.title"),
    description: t("metadata.description"),
    path: "/goals",
    locale: getSeoLocale(locale),
  });
}

export default async function GoalsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const [goals, labels, tasks] = await Promise.all([
    listGoals(session.user.id),
    listLabels(session.user.id),
    listTasks(session.user.id),
  ]);

  return (
    <GoalsShell
      initialGoals={goals}
      availableLabels={labels}
      availableTasks={tasks.map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
      }))}
    />
  );
}
