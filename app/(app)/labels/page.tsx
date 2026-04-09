import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations, getLocale } from "@/lib/i18n";
import { auth } from "@/lib/auth/auth";
import { defineSEO, getSeoLocale } from "@/lib/seo";
import { listLabels } from "@/lib/labels";
import { LabelsShell } from "@/components/labels";
import type { AppLanguage } from "@/types/i18n";

export async function generateMetadata() {
  const t = await getTranslations("labels");
  const locale = (await getLocale()) as AppLanguage;
  return defineSEO({
    title: t("metadata.title"),
    description: t("metadata.description"),
    path: "/labels",
    locale: getSeoLocale(locale),
  });
}

export default async function LabelsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const labels = await listLabels(session.user.id);

  return <LabelsShell initialLabels={labels} />;
}
