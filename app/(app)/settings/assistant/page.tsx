/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Bot } from "lucide-react";
import { getRequestConfig } from "@/i18n/request";
import { auth } from "@/lib/auth";
import { getMessage } from "@/lib/i18n";
import { getUserPreferences } from "@/lib/settings/get.logic";
import { AssistantSettingsForm } from "@/components/settings";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const { messages } = await getRequestConfig();
  return {
    title: getMessage(
      messages,
      "assistant.metadata.title",
      "Assistant Settings",
    ),
    description: getMessage(
      messages,
      "assistant.metadata.description",
      "Customize your assistant's name, behavior, and language.",
    ),
  };
}

export default async function AssistantSettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  const { messages } = await getRequestConfig();
  const preferences = await getUserPreferences(session.user.id);

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-8 sm:px-8">
      {/* Page header */}
      <div className="mb-8 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl border border-border/70 bg-card/70 shadow-sm">
          <Bot className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-semibold leading-none">
            {getMessage(messages, "assistant.page.title", "Assistant Settings")}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {getMessage(
              messages,
              "assistant.page.subtitle",
              "Configure the assistant's identity, language, and default behavior.",
            )}
          </p>
        </div>
      </div>

      {/* Form card */}
      <div className="rounded-2xl border border-border/70 bg-card/70 p-6 shadow-sm backdrop-blur">
        <AssistantSettingsForm
          initialPreferences={preferences}
          messages={messages}
        />
      </div>
    </div>
  );
}
