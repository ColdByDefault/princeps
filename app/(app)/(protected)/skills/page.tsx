/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.2.1
 * @since canary-v1.1.10
 */

import { getLocale, getTranslations } from "@/lib/core/i18n";
import { requireSession } from "@/lib/core/auth/session";
import { defineSEO, getSeoLocale } from "@/lib/core/seo";
import { TOOL_REGISTRY } from "@/lib/ai/tools";
import { listSkills } from "@/lib/features/skills";
import { getUserTier } from "@/lib/platform/tiers";
import { SkillsShell } from "@/components/features/skills";
import { getPlanLimits, type Tier } from "@/types/billing";
import type { ToolDisplayEntry } from "@/types/api";
import type { AppLanguage } from "@/types/i18n";

export async function generateMetadata() {
  const t = await getTranslations("skills");
  const locale = (await getLocale()) as AppLanguage;

  return defineSEO({
    title: t("metadata.title"),
    description: t("metadata.description"),
    path: "/skills",
    locale: getSeoLocale(locale),
  });
}

export default async function SkillsPage() {
  const session = await requireSession();

  

  const [skills, currentTier] = await Promise.all([
    listSkills(session.user.id),
    getUserTier(session.user.id),
  ]);

  const allTools: ToolDisplayEntry[] = TOOL_REGISTRY.map(
    ({ function: fn, minTier, group }) => ({
      name: fn.name,
      minTier,
      group,
    }),
  );

  const skillsLimit = getPlanLimits(currentTier as Tier).skillsMax;

  return (
    <SkillsShell
      initialSkills={skills}
      allTools={allTools}
      currentTier={currentTier as Tier}
      skillsLimit={skillsLimit}
    />
  );
}
