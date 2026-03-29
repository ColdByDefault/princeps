/**
 * @author ColdByDefault
 * @copyright  2026 ColdByDefault. All Rights Reserved.
 *
 */

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getRequestConfig } from "@/i18n/request";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { OnboardingWizard } from "./OnboardingWizard";

export const metadata = { title: "Welcome" };

export default async function OnboardingPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  // If already completed, skip forward
  const userRow = await db.user.findUnique({
    where: { id: session.user.id },
    select: { preferences: true },
  });
  const rawPrefs =
    userRow?.preferences != null &&
    typeof userRow.preferences === "object" &&
    !Array.isArray(userRow.preferences)
      ? (userRow.preferences as Record<string, unknown>)
      : {};
  // Route through confirm so it can set the ob_done cookie before landing on /home
  if (rawPrefs["onboardingDone"]) redirect("/api/onboarding/confirm");

  const { messages, language } = await getRequestConfig();

  return (
    <OnboardingWizard
      messages={messages as Record<string, string>}
      defaultLanguage={language}
    />
  );
}
