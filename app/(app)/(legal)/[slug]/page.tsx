/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version beta
 * @since beta
 * @module
 * @description
 */

import { notFound } from "next/navigation";
import { getTranslations, getLocale } from "@/lib/i18n";
import { defineSEO, getSeoLocale } from "@/lib/seo";
import { Separator } from "@/components/ui/separator";
import type { AppLanguage } from "@/types/i18n";

const legalPages = {
  "privacy-policy": { namespaceKey: "privacyPolicy" },
  "terms-of-use": { namespaceKey: "termsOfUse" },
  "cookie-policy": { namespaceKey: "cookiePolicy" },
  security: { namespaceKey: "security" },
} as const;

type LegalSlug = keyof typeof legalPages;

function isLegalSlug(value: string): value is LegalSlug {
  return value in legalPages;
}

type LegalSection = { heading: string; content: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!isLegalSlug(slug)) return {};

  const { namespaceKey } = legalPages[slug];
  const t = await getTranslations("legal");
  const locale = (await getLocale()) as AppLanguage;

  return defineSEO({
    title: t(`${namespaceKey}.metadata.title` as Parameters<typeof t>[0]),
    description: t(
      `${namespaceKey}.metadata.description` as Parameters<typeof t>[0],
    ),
    path: `/${slug}`,
    locale: getSeoLocale(locale),
  });
}

export default async function LegalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  if (!isLegalSlug(slug)) {
    notFound();
  }

  const { namespaceKey } = legalPages[slug];
  const t = await getTranslations("legal");

  const title = t(`${namespaceKey}.title` as Parameters<typeof t>[0]);
  const lastUpdated = t(
    `${namespaceKey}.lastUpdated` as Parameters<typeof t>[0],
  );
  const lastUpdatedLabel = t("lastUpdatedLabel");
  const sections = t.raw(
    `${namespaceKey}.sections` as Parameters<typeof t>[0],
  ) as LegalSection[];

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-10 sm:px-8 lg:px-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {lastUpdatedLabel}: {lastUpdated}
        </p>
      </div>

      <Separator className="mb-8" />

      <div className="space-y-8">
        {sections.map((section) => (
          <section key={section.heading} aria-labelledby={section.heading}>
            <h2
              id={section.heading}
              className="mb-3 text-base font-semibold tracking-tight"
            >
              {section.heading}
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {section.content}
            </p>
          </section>
        ))}
      </div>
    </div>
  );
}
