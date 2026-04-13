/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { getLocale } from "next-intl/server";
import { auth } from "@/lib/auth/auth";
import { getUserPreferences } from "@/lib/settings";
import { Navbar, Footer, GlobalSearch } from "@/components/navigation";
import { LanguageHydrator, ThemeHydrator } from "@/components/shared";
import { ChatWidgetProvider } from "@/components/chat-widget";
import { CalendarDrawerProvider } from "@/components/calendar";
import type { AppLanguage } from "@/types/i18n";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  const sessionUser = session?.user ?? null;

  const locale = (await getLocale()) as AppLanguage;

  let preferredTheme: string | null = null;
  let preferredLanguage: AppLanguage | null = null;
  let preferredAssistantName: string | null = null;
  if (sessionUser?.id) {
    const prefs = await getUserPreferences(sessionUser.id);
    preferredTheme = prefs.theme;
    preferredLanguage = prefs.language;
    preferredAssistantName = prefs.assistantName;
  }

  return (
    <div className="flex min-h-screen flex-col">

      {/* Restore language and theme from DB on first load after a browser wipe */}
      <LanguageHydrator
        language={locale}
        preferredLanguage={preferredLanguage}
      />
      <ThemeHydrator theme={preferredTheme} />
      <CalendarDrawerProvider>
        <Navbar sessionUser={sessionUser} />
        <main className="flex flex-1 min-h-0 flex-col">{children}</main>
        <Footer />
      </CalendarDrawerProvider>
      <ChatWidgetProvider
        authenticated={!!sessionUser}
        userId={sessionUser?.id ?? ""}
        assistantName={preferredAssistantName ?? undefined}
      />
      {sessionUser && <GlobalSearch />}
    </div>
  );
}
