/**
 * @author ColdByDefault
 * @copyright  2026 ColdByDefault. All Rights Reserved.
 */

import { type Metadata } from "next";
import { SignUpCard } from "@/components/auth";
import { getRequestConfig } from "@/i18n/request";
import { getMessage } from "@/lib/i18n";
import { defineSEO, getSeoLocale } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const { language, messages } = await getRequestConfig();

  return defineSEO({
    title: getMessage(messages, "auth.signUp.metadata.title", "Create Account"),
    description: getMessage(
      messages,
      "auth.signUp.metadata.description",
      "Create your See-Sweet workspace and start shaping your assistant.",
    ),
    path: "/sign-up",
    locale: getSeoLocale(language),
  });
}

export default async function SignUpPage() {
  const { messages } = await getRequestConfig();

  return <SignUpCard messages={messages} />;
}
