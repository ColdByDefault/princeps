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
import type { AppLanguage } from "@/types/i18n";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  const sessionUser = session?.user ?? null;

  // Locale resolved by i18n/request.ts (may have come from DB if cookie was absent)
  const locale = (await getLocale()) as AppLanguage;

  let preferredTheme: string | null = null;
  if (sessionUser?.id) {
    const prefs = await getUserPreferences(sessionUser.id);
    preferredTheme = prefs.theme;
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Restore language cookie and theme from DB when browser wipes them */}
      <LanguageHydrator language={locale} />
      <ThemeHydrator theme={preferredTheme} />
      <Navbar sessionUser={sessionUser} />
      <main className="flex flex-1 flex-col">{children}</main>
      <Footer />
    </div>
  );
}
