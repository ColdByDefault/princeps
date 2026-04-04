/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import { useTranslations, useLocale } from "next-intl";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PlanBadge } from "@/components/shared";
import { Separator } from "@/components/ui/separator";

export type ProfileUser = {
  name: string | null;
  username: string | null;
  email: string;
  tier: string;
  role: string;
  createdAt: string;
  timezone: string;
};

function getInitials(name: string | null, email: string): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  }
  return email[0].toUpperCase();
}

type ProfileShellProps = {
  user: ProfileUser;
};

export default function ProfileShell({ user }: ProfileShellProps) {
  const t = useTranslations("profile");
  const locale = useLocale();

  const initials = getInitials(user.name, user.email);
  const displayName = user.name?.trim() || user.email;

  const memberSince = new Date(user.createdAt).toLocaleDateString(
    locale === "de" ? "de-DE" : "en-US",
    { year: "numeric", month: "long", day: "numeric" },
  );

  const rows: { label: string; value: React.ReactNode }[] = [
    {
      label: t("name"),
      value: (
        <span className="text-sm text-foreground">
          {user.name?.trim() ?? (
            <span className="text-muted-foreground">{t("notSet")}</span>
          )}
        </span>
      ),
    },
    {
      label: t("email"),
      value: <span className="text-sm text-foreground">{user.email}</span>,
    },
    {
      label: t("plan"),
      value: <PlanBadge tier={user.tier} />,
    },
    {
      label: t("memberSince"),
      value: <span className="text-sm text-foreground">{memberSince}</span>,
    },
    {
      label: t("timezone"),
      value: (
        <span className="text-sm text-foreground font-mono">
          {user.timezone}
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-1 flex-col items-center justify-start px-4 py-12 sm:px-6">
      <div className="w-full max-w-md">
        {/* Header card */}
        <div className="rounded-[1.75rem] border border-border/60 bg-card/60 px-6 py-8 shadow-sm backdrop-blur-sm">
          {/* Avatar + name */}
          <div className="flex flex-col items-center gap-3 text-center">
            <Avatar className="size-20 text-2xl">
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-lg font-semibold text-foreground">
                {displayName}
              </h1>
              {user.username?.trim() && (
                <p className="text-sm text-muted-foreground">
                  @{user.username}
                </p>
              )}
            </div>
          </div>

          <Separator className="my-6" />

          {/* Info rows */}
          <dl className="space-y-4">
            {rows.map((row, i) => (
              <div key={i} className="flex items-center justify-between gap-4">
                <dt className="text-sm text-muted-foreground shrink-0">
                  {row.label}
                </dt>
                <dd className="text-right">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}
