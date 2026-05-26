/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.2.1
 * @since beta
 */

import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations, getLocale } from "@/lib/core/i18n";
import { auth } from "@/lib/core/auth/auth";
import { defineSEO, getSeoLocale } from "@/lib/core/seo";
import { listGoals } from "@/lib/features/goals";
import { listLabels } from "@/lib/features/labels";
import { listTasks } from "@/lib/features/tasks";
import { listContacts } from "@/lib/features/contacts";
import { GoalsShell } from "@/components/features/goals";
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

  const [goals, labels, tasks, contacts] = await Promise.all([
    listGoals(session.user.id),
    listLabels(session.user.id),
    listTasks(session.user.id),
    listContacts(session.user.id),
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
      availableContacts={contacts.map((c) => ({ id: c.id, name: c.name }))}
    />
  );
}


