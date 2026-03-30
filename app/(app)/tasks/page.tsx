/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getRequestConfig } from "@/i18n/request";
import { listTasks } from "@/lib/tasks/list.logic";
import { TasksView } from "@/components/tasks";
import type { Metadata } from "next";
import { getMessage } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const { messages } = await getRequestConfig();
  return {
    title: getMessage(messages, "tasks.metadata.title", "Tasks"),
    description: getMessage(
      messages,
      "tasks.metadata.description",
      "Track your open actions, priorities, and deadlines.",
    ),
  };
}

export default async function TasksPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const { messages } = await getRequestConfig();

  const rawTasks = await listTasks(session.user.id);

  const tasks = rawTasks.map((t) => ({
    ...t,
    dueDate: t.dueDate ? t.dueDate.toISOString() : null,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  }));

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col px-6 py-8 sm:px-8 lg:px-10">
      <TasksView messages={messages} initialTasks={tasks} />
    </div>
  );
}
