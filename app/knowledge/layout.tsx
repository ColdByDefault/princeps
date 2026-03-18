/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { type Metadata } from "next";
import { getRequestConfig } from "@/i18n/request";
import { getMessage } from "@/lib/i18n";
import { defineSEO, getSeoLocale } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const { language, messages } = await getRequestConfig();

  return defineSEO({
    title: getMessage(messages, "knowledge.metadata.title", "Knowledge base"),
    description: getMessage(
      messages,
      "knowledge.metadata.description",
      "Manage indexed documents and assistant-facing personal info.",
    ),
    path: "/knowledge",
    locale: getSeoLocale(language),
    noIndex: true,
  });
}

export default function KnowledgeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
