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
    title: getMessage(messages, "auth.login.metadata.title", "Sign In"),
    description: getMessage(
      messages,
      "auth.login.metadata.description",
      "Sign in to your Akhiil workspace and continue with your assistant.",
    ),
    path: "/login",
    locale: getSeoLocale(language),
  });
}

export default function LoginLayout({
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
