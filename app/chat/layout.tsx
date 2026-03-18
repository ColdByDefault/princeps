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
    title: getMessage(messages, "chat.metadata.title", "Chat"),
    description: getMessage(
      messages,
      "chat.metadata.description",
      "Use the persistent workspace conversation for retrieval-backed answers.",
    ),
    path: "/chat",
    locale: getSeoLocale(language),
    noIndex: true,
  });
}

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
