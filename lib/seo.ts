/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { type Metadata } from "next";
import { DEFAULT_LANGUAGE, type AppLanguage } from "@/types/i18n";

type DefineSeoInput = {
  title: string;
  description: string;
  path?: string;
  locale?: string;
  noIndex?: boolean;
};

function getSiteUrl(): URL {
  const baseUrl =
    process.env.BETTER_AUTH_URL ??
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL ??
    "http://localhost:3000";

  return new URL(baseUrl);
}

export function getSeoLocale(language: AppLanguage): string {
  return language === "de" ? "de_DE" : "en_US";
}

export function defineSEO({
  title,
  description,
  path = "/",
  locale = getSeoLocale(DEFAULT_LANGUAGE),
  noIndex = false,
}: DefineSeoInput): Metadata {
  const siteUrl = getSiteUrl();
  const url = new URL(path, siteUrl).toString();

  return {
    metadataBase: siteUrl,
    title,
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      title,
      description,
      url,
      locale,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
        }
      : undefined,
  };
}
