/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version beta
 * @since beta
 * @module
 * @description
 */

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations, getLocale } from "@/lib/i18n";
import { auth } from "@/lib/auth/auth";
import { defineSEO, getSeoLocale } from "@/lib/seo";
import { listTasks } from "@/lib/tasks";
import { listLabels } from "@/lib/labels";
import { listGoals } from "@/lib/goals";
import { TasksShell } from "@/components/tasks";
import type { AppLanguage } from "@/types/i18n";

export async function generateMetadata() {
  const t = await getTranslations("tasks");
  const locale = (await getLocale()) as AppLanguage;

  return defineSEO({
    title: t("metadata.title"),
    description: t("metadata.description"),
    path: "/tasks",
    locale: getSeoLocale(locale),
  });
}

export default async function TasksPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  const [tasks, labels, goals] = await Promise.all([
    listTasks(session.user.id),
    listLabels(session.user.id),
    listGoals(session.user.id),
  ]);

  return (
    <TasksShell
      initialTasks={tasks}
      availableLabels={labels}
      availableGoals={goals.map((g) => ({ id: g.id, title: g.title }))}
    />
  );
}
