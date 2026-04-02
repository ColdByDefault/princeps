/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { type Metadata } from "next";
import { notFound } from "next/navigation";
import { getRequestConfig } from "@/i18n/request";
import { getMessage } from "@/lib/i18n";
import { defineSEO, getSeoLocale } from "@/lib/seo";

const legalPages = {
  "privacy-policy": {
    bodyKey: "legal.privacyPolicy.body",
    descriptionKey: "legal.privacyPolicy.metadata.description",
    path: "/privacy-policy",
    titleKey: "legal.privacyPolicy.title",
    metadataTitleKey: "legal.privacyPolicy.metadata.title",
  },
  "terms-of-use": {
    bodyKey: "legal.termsOfUse.body",
    descriptionKey: "legal.termsOfUse.metadata.description",
    path: "/terms-of-use",
    titleKey: "legal.termsOfUse.title",
    metadataTitleKey: "legal.termsOfUse.metadata.title",
  },
  security: {
    bodyKey: "legal.security.body",
    descriptionKey: "legal.security.metadata.description",
    path: "/security",
    titleKey: "legal.security.title",
    metadataTitleKey: "legal.security.metadata.title",
  },
} as const;

type LegalSlug = keyof typeof legalPages;

function isLegalSlug(value: string): value is LegalSlug {
  return value in legalPages;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  if (!isLegalSlug(slug)) {
    return {};
  }

  const { language, messages } = await getRequestConfig();
  const page = legalPages[slug];

  return defineSEO({
    title: getMessage(messages, page.metadataTitleKey, "Policy"),
    description: getMessage(
      messages,
      page.descriptionKey,
      "Policy information",
    ),
    path: page.path,
    locale: getSeoLocale(language),
  });
}

export default async function LegalPlaceholderPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  if (!isLegalSlug(slug)) {
    notFound();
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 px-6 py-8 sm:px-8 lg:px-10">
      leave empty for now, will add content later
    </div>
  );
}
