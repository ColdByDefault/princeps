/**
 * @author ColdByDefault
 * @copyright  2026 ColdByDefault. All Rights Reserved.
 *
 */

import { headers } from "next/headers";
import { redirect } from "next/navigation";
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
    <div className="flex h-screen items-center justify-center">
      <div className="p-8 shadow-md">
        <h1 className="mb-4 text-2xl font-bold">
          {greeting}, {firstName}!
        </h1>
      </div>
    </div>
  );
}
