/**
 * @author ColdByDefault
 * @copyright  2026 ColdByDefault. All Rights Reserved.
 *
 */

import { type Metadata } from "next";
import { LoginCard } from "@/components/auth";
import { getRequestConfig } from "@/i18n/request";
import { getMessage } from "@/lib/i18n";
import { defineSEO, getSeoLocale } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const { language, messages } = await getRequestConfig();

  return defineSEO({
    title: getMessage(messages, "auth.login.metadata.title", "Sign In"),
    description: getMessage(
      messages,
      "auth.login.metadata.description",
      "Sign in to your See-Sweet workspace and continue with your assistant.",
    ),
    path: "/login",
    locale: getSeoLocale(language),
  });
}

export default async function LoginPage() {
  const { messages } = await getRequestConfig();

  return <LoginCard messages={messages} />;
}
