/**
 * @author ColdByDefault
 * @copyright  2026 ColdByDefault. All Rights Reserved.
 *
 */

import { type Metadata } from "next";
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

export default function SignUpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[calc(100svh-4rem)] items-center justify-center px-4 py-10">
      <div className="w-full max-w-6xl">{children}</div>
    </div>
  );
}
