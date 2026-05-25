/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.10
 * @since beta
 */

"use client";

import React from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  MessageSquare,
  Settings,
  CheckSquare,
  CreditCard,
  BrainCircuit,
  Users,
  CalendarDays,
  Scale,
  Tag,
  Target,
  BookMarked,
  Newspaper,
  FileBarChart2,
  BookOpen,
  Sparkles,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import NavbarDesktop from "@/components/settings/navigation/Navbar-Desktop";
import {
  NavbarMobileBar,
  NavbarMobilePanel,
} from "@/components/settings/navigation/Navbar-Mobile";
import { authClient } from "@/lib/core/auth/auth-client";
import {
  GREETING_TOAST_SESSION_KEY,
  GREETING_SESSION_KEY,
} from "@/hooks/use-notifications";

export { LanguageToggle } from "@/components/shared";

const HIDDEN_NAVBAR_PATHS = new Set(["/", "/login", "/sign-up"]);

type NavbarProps = {
  sessionUser: {
    email: string | null;
    name: string | null;
    role?: string | null;
    tier?: string | null;
  } | null;
};

function getInitials(
  name: string | null | undefined,
  email: string | null | undefined,
): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  }
  if (email) return email[0].toUpperCase();
  return "U";
}

export default function Navbar({ sessionUser }: NavbarProps) {
  const t = useTranslations("shell");
  const tCommon = useTranslations("common");
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpenForPath, setMenuOpenForPath] = useState<string | null>(null);
  const isMenuOpen = menuOpenForPath === pathname;
  const setIsMenuOpen = (value: React.SetStateAction<boolean>) => {
    const next =
      typeof value === "function" ? value(menuOpenForPath === pathname) : value;
    setMenuOpenForPath(next ? pathname : null);
  };
  const [isSigningOut, setIsSigningOut] = useState(false);

  if (
    HIDDEN_NAVBAR_PATHS.has(pathname) ||
    pathname.startsWith("/chat") ||
    !sessionUser
  ) {
    return null;
  }

  const navLinks = [
    { href: "/home", icon: LayoutDashboard, label: t("nav.home") },
    { href: "/chat", icon: MessageSquare, label: t("nav.chat") },
    {
      href: "/knowledge",
      icon: BrainCircuit,
      label: tCommon("entities.knowledge"),
    },
    { href: "/skills", icon: Sparkles, label: tCommon("entities.skills") },
    { href: "/labels", icon: Tag, label: tCommon("entities.labels") },
    { href: "/tasks", icon: CheckSquare, label: tCommon("entities.tasks") },
    { href: "/goals", icon: Target, label: tCommon("entities.goals") },
    { href: "/contacts", icon: Users, label: tCommon("entities.contacts") },
    {
      href: "/meetings",
      icon: CalendarDays,
      label: tCommon("entities.meetings"),
    },
    {
      href: "/decisions",
      icon: Scale,
      label: tCommon("entities.decisions"),
    },
    { href: "/memory", icon: BookMarked, label: tCommon("entities.memory") },
    {
      href: "/reading-queue",
      icon: BookOpen,
      label: tCommon("entities.readingQueue"),
    },
    {
      href: "/briefings",
      icon: Newspaper,
      label: tCommon("entities.dailyBriefing"),
    },
    {
      href: "/reports",
      icon: FileBarChart2,
      label: tCommon("entities.reports"),
    },
    {
      href: "/settings",
      icon: Settings,
      label: tCommon("entities.settings"),
    },
    { href: "/pricing", icon: CreditCard, label: tCommon("entities.plans") },
  ];

  const userLabel =
    sessionUser?.name?.trim() || sessionUser?.email || t("nav.userFallback");

  const userInitials = getInitials(sessionUser?.name, sessionUser?.email);

  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    const result = await authClient.signOut();
    if (result.error) {
      setIsSigningOut(false);
      return;
    }
    sessionStorage.removeItem(GREETING_SESSION_KEY);
    sessionStorage.removeItem(GREETING_TOAST_SESSION_KEY);
    router.replace("/");
    router.refresh();
  };

  return (
    <div className="sticky top-0 z-40">
      <div>
        <div className="border-b border-border/70 bg-background/95 px-6 py-2.5 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <Link
              href="/home"
              className="cursor-pointer px-2 py-1 text-sm font-bold tracking-[0.22em] text-foreground uppercase transition hover:text-primary"
            >
              {t("nav.brand")}
            </Link>
            <NavbarDesktop
              navLinks={navLinks}
              pathname={pathname}
              tier={sessionUser.tier}
              userInitials={userInitials}
              isSigningOut={isSigningOut}
              onSignOut={handleSignOut}
            />
            <NavbarMobileBar
              isMenuOpen={isMenuOpen}
              setIsMenuOpen={setIsMenuOpen}
            />
          </div>
          {isMenuOpen && (
            <NavbarMobilePanel
              navLinks={navLinks}
              pathname={pathname}
              tier={sessionUser.tier}
              userLabel={userLabel}
              userInitials={userInitials}
              isSigningOut={isSigningOut}
              onSignOut={handleSignOut}
            />
          )}
        </div>
      </div>
    </div>
  );
}
