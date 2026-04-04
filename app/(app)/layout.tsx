/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { getLocale } from "next-intl/server";
import { auth } from "@/lib/auth/auth";
import { getUserPreferences } from "@/lib/settings/user-preferences.logic";
import { Navbar, Footer } from "@/components/navigation";
import { LanguageHydrator, ThemeHydrator } from "@/components/shared";
import { ChatWidgetProvider } from "@/components/chat-widget/ChatWidgetProvider";
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
  if (sessionUser?.id) {
    const prefs = await getUserPreferences(sessionUser.id);
    preferredTheme = prefs.theme;
    preferredLanguage = prefs.language;
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Restore language and theme from DB on first load after a browser wipe */}
      <LanguageHydrator
        language={locale}
        preferredLanguage={preferredLanguage}
      />
      <ThemeHydrator theme={preferredTheme} />
      <Navbar sessionUser={sessionUser} />
      <main className="flex flex-1 min-h-0 flex-col">{children}</main>
      <Footer />
      <ChatWidgetProvider
        authenticated={!!sessionUser}
        userId={sessionUser?.id ?? ""}
      />
    </div>
  );
}
