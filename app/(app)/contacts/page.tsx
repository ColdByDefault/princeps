/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations, getLocale } from "@/lib/i18n";
import { auth } from "@/lib/auth/auth";
import { defineSEO, getSeoLocale } from "@/lib/seo";
import { listContacts } from "@/lib/contacts/list.logic";
import { listLabels } from "@/lib/labels/list.logic";
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

  return <ContactsShell initialContacts={contacts} availableLabels={labels} />;
}
