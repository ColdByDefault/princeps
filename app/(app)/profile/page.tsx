/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * SPDX-License-Identifier: Elastic-2.0
 */

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations, getLocale } from "@/lib/i18n";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { defineSEO, getSeoLocale } from "@/lib/seo";
import { ProfileShell } from "@/components/profile";
import type { AppLanguage } from "@/types/i18n";

export async function generateMetadata() {
  const t = await getTranslations("profile");
  const locale = (await getLocale()) as AppLanguage;

  return defineSEO({
    title: t("metadata.title"),
    description: t("metadata.description"),
    path: "/profile",
    locale: getSeoLocale(locale),
  });
}

export default async function ProfilePage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      username: true,
      email: true,
      emailVerified: true,
      tier: true,
      role: true,
      createdAt: true,
      timezone: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  return (
    <ProfileShell
      user={{
        name: user.name ?? null,
        username: user.username ?? null,
        email: user.email,
        emailVerified: user.emailVerified,
        tier: user.tier,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
        timezone: user.timezone,
      }}
    />
  );
}
