/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * SPDX-License-Identifier: Elastic-2.0
 */

"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Pencil } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PlanBadge } from "@/components/shared";
import { Separator } from "@/components/ui/separator";
import { EditProfileDialog } from "./EditProfileDialog";
import { useProfileMutations } from "./logic/useProfileMutations";

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

  const [name, setName] = useState<string | null>(user.name);
  const [username, setUsername] = useState<string | null>(user.username);
  const [editOpen, setEditOpen] = useState(false);

  const { updating, updateProfile } = useProfileMutations(
    (newName, newUsername) => {
      setName(newName);
      setUsername(newUsername);
    },
    {
      updateSuccess: t("editDialog.updateSuccess"),
      updateError: t("editDialog.updateError"),
      usernameTaken: t("editDialog.usernameTaken"),
    },
  );

  const initials = getInitials(name, user.email);
  const displayName = name?.trim() || user.email;

  const memberSince = formatDate(user.createdAt, locale);

  const rows: { label: string; value: React.ReactNode }[] = [
    {
      label: t("name"),
      value: (
        <span className="text-sm text-foreground">
          {name?.trim() ?? (
            <span className="text-muted-foreground">{t("notSet")}</span>
          )}
        </span>
      ),
    },
    {
      label: t("username"),
      value: (
        <span className="text-sm text-foreground">
          {username?.trim() ? (
            <span className="font-mono">@{username}</span>
          ) : (
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
              {username?.trim() && (
                <p className="text-sm text-muted-foreground">@{username}</p>
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

          <Separator className="my-6" />

          {/* Edit button */}
          <div className="flex justify-center">
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer gap-2"
              aria-label={t("editDialog.heading")}
              onClick={() => setEditOpen(true)}
            >
              <Pencil className="size-3.5" />
              {t("editDialog.heading")}
            </Button>
          </div>
        </div>
      </div>

      <EditProfileDialog
        name={name}
        username={username}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSubmit={updateProfile}
        updating={updating}
      />
    </div>
  );
}
