/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.7
 * @since beta
 */

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations, getLocale, getMessages } from "@/lib/core/i18n";
import { auth } from "@/lib/core/auth/auth";
import { defineSEO, getSeoLocale } from "@/lib/core/seo";
import { listContacts } from "@/lib/features/contacts";
import { listLabels } from "@/lib/features/labels";
import { ContactsShell } from "@/components/contact";
import type { AppLanguage } from "@/types/i18n";

export async function generateMetadata() {
  const t = await getTranslations("contacts");
  const locale = (await getLocale()) as AppLanguage;

  return defineSEO({
    title: t("metadata.title"),
    description: t("metadata.description"),
    path: "/contacts",
    locale: getSeoLocale(locale),
  });
}

export default async function ContactPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  const [contacts, labels] = await Promise.all([
    listContacts(session.user.id),
    listLabels(session.user.id),
  ]);

  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={{ contacts: messages.contacts }}>
      <ContactsShell initialContacts={contacts} availableLabels={labels} />
    </NextIntlClientProvider>
  );
}
