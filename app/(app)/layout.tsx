/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { getLocale } from "next-intl/server";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
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
  let hasGoogleCalendar = false;
  let userTier: string = "free";
  if (sessionUser?.id) {
    const [prefs, gcalIntegration, userRow] = await Promise.all([
      getUserPreferences(sessionUser.id),
      db.integration.findFirst({
        where: { userId: sessionUser.id, provider: "google_calendar" },
        select: { id: true },
      }),
      db.user.findUnique({
        where: { id: sessionUser.id },
        select: { tier: true },
      }),
    ]);
    preferredTheme = prefs.theme;
    preferredLanguage = prefs.language;
    preferredAssistantName = prefs.assistantName;
    hasGoogleCalendar = gcalIntegration !== null;
    userTier = userRow?.tier ?? "free";
  }

  return (
    <div className="flex min-h-screen flex-col" data-tier={userTier}>
      {/* Restore language and theme from DB on first load after a browser wipe */}
      <LanguageHydrator
        language={locale}
        preferredLanguage={preferredLanguage}
      />
      <ThemeHydrator theme={preferredTheme} />
      <CalendarDrawerProvider hasGoogleCalendar={hasGoogleCalendar}>
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
