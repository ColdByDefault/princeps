/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  MessageSquare,
  Settings,
  CheckSquare,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import NavbarDesktop from "@/components/navigation/Navbar-Desktop";
import {
  NavbarMobileBar,
  NavbarMobilePanel,
} from "@/components/navigation/Navbar-Mobile";
import { authClient } from "@/lib/auth/auth-client";

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

export default function Navbar({ sessionUser }: NavbarProps) {
  const t = useTranslations("shell");
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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
    { href: "/tasks", icon: CheckSquare, label: t("nav.tasks") },
    { href: "/settings", icon: Settings, label: t("nav.settings") },
  ];

  const userLabel =
    sessionUser?.name?.trim() || sessionUser?.email || t("nav.userFallback");

  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    const result = await authClient.signOut();
    if (result.error) {
      setIsSigningOut(false);
      return;
    }
    router.replace("/login");
    router.refresh();
  };

  return (
    <div className="sticky top-4 z-40 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-[1.75rem] border border-black/10 bg-white/50 px-4 py-3 shadow-lg shadow-black/5 backdrop-blur-xl dark:border-white/10 dark:bg-black/35">
          <div className="flex items-center gap-3">
            <Link
              href="/home"
              className="cursor-pointer rounded-full px-2 py-1 text-sm font-semibold tracking-[0.22em] text-foreground uppercase transition hover:text-primary"
            >
              {t("nav.brand")}
            </Link>
            <NavbarDesktop
              navLinks={navLinks}
              pathname={pathname}
              tier={sessionUser.tier}
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
              isSigningOut={isSigningOut}
              onSignOut={handleSignOut}
            />
          )}
        </div>
      </div>
    </div>
  );
}
