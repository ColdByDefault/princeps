/**
 * @author ColdByDefault
 * @copyright  2026 ColdByDefault. All Rights Reserved.
 *
 */

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import { getRequestConfig } from "@/i18n/request";
import { auth } from "@/lib/auth";
import { getMessage } from "@/lib/i18n";

function getGreeting(messages: Record<string, string>): string {
  const hour = new Date().getHours();
  if (hour < 12) {
    return getMessage(messages, "home.greetingMorning", "");
  }
  if (hour < 18) {
    return getMessage(messages, "home.greetingAfternoon", "");
  }
  return getMessage(messages, "home.greetingEvening", "");
}

export default async function HomePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const { messages } = await getRequestConfig();

  if (!session) {
    redirect("/login");
  }

  const greeting = getGreeting(messages);
  const firstName = session.user.name?.split(" ")[0] ?? "";

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-7xl flex-col px-6 py-8 sm:px-8 lg:px-10">
      <section className="grid gap-6 rounded-[2rem] border border-border/70 bg-card/70 p-6 shadow-2xl shadow-black/5 backdrop-blur lg:grid-cols-[1.15fr_0.85fr] lg:p-8">
        <div className="space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-4 py-2 text-sm text-muted-foreground">
            <Sparkles className="size-4 text-primary" />
            {getMessage(messages, "home.focusTitle", "What matters now")}
          </div>
          <div className="space-y-3">
            <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              {greeting}, {firstName}.
            </h1>
            <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
              {getMessage(
                messages,
                "home.description",
                "Your private executive workspace. Stay organized, make decisions, and move work forward.",
              )}
            </p>
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-border/70 bg-background/70 p-5">
          <p className="text-sm font-semibold tracking-[0.22em] text-muted-foreground uppercase">
            {getMessage(messages, "home.focusTitle", "What matters now")}
          </p>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            {getMessage(
              messages,
              "home.focusBody",
              "Keep your context, decisions, and follow-through in one place.",
            )}
          </p>
        </div>
      </section>
    </div>
  );
}
