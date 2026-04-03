/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations, getLocale } from "@/lib/i18n";
import { auth } from "@/lib/auth/auth";
import { defineSEO, getSeoLocale } from "@/lib/seo";
import { listTasks } from "@/lib/tasks/list.logic";
import { listLabels } from "@/lib/labels/list.logic";
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

  const [tasks, labels] = await Promise.all([
    listTasks(session.user.id),
    listLabels(session.user.id),
  ]);

  return <TasksShell initialTasks={tasks} availableLabels={labels} />;
}
