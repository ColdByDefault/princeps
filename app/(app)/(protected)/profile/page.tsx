/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.2.1
 * @since beta
 */

import { redirect } from "next/navigation";
import { getTranslations, getLocale } from "@/lib/core/i18n";
import { requireSession } from "@/lib/core/auth/session";
import { db } from "@/lib/core/db";
import { defineSEO, getSeoLocale } from "@/lib/core/seo";
import { ProfileShell } from "@/components/settings/profile";
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
  const session = await requireSession();

  

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

