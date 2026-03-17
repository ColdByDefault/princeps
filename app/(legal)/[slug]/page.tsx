/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { type Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { getRequestConfig } from "@/i18n/request";
import { auth } from "@/lib/auth";
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
    title: getMessage(messages, page.metadataTitleKey, "Placeholder"),
    description: getMessage(messages, page.descriptionKey, "Placeholder page"),
    path: page.path,
    locale: getSeoLocale(language),
  });
}

export default async function LegalPlaceholderPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const { slug } = await params;

  if (!isLegalSlug(slug)) {
    notFound();
  }

  const { messages } = await getRequestConfig();
  const page = legalPages[slug];

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 px-6 py-8 sm:px-8 lg:px-10">
      <section className="flex w-full flex-1 items-center justify-center">
        <div className="w-full rounded-[2rem] border border-border/70 bg-card/70 p-6 shadow-2xl shadow-black/5 backdrop-blur lg:p-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-4 py-2 text-sm text-muted-foreground">
            <ShieldCheck className="size-4 text-primary" />
            {getMessage(
              messages,
              "legal.placeholder.badge",
              "Phase 2 placeholder",
            )}
          </div>

          <div className="mt-6 space-y-4">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {getMessage(messages, page.titleKey, "Placeholder page")}
            </h1>
            <p className="max-w-3xl text-base leading-8 text-muted-foreground sm:text-lg">
              {getMessage(
                messages,
                "legal.placeholder.description",
                "This page is in place for the authenticated shell and legal navigation. Replace the placeholder content when the final policy text is ready.",
              )}
            </p>
          </div>

          <div className="mt-8 rounded-[1.5rem] border border-border/70 bg-background/70 p-5">
            <p className="text-sm leading-7 text-foreground">
              {getMessage(messages, page.bodyKey, "Placeholder body")}
            </p>
          </div>

          <p className="mt-6 text-sm leading-7 text-muted-foreground">
            {getMessage(
              messages,
              "legal.placeholder.note",
              "The current version is intentionally short and exists to complete the protected navigation flow in Phase 2.",
            )}
          </p>
        </div>
      </section>
    </div>
  );
}
