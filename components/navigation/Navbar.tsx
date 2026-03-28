/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  FileText,
  Globe,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  X,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { NotificationPanel } from "@/components/notifications";
import { useLanguage } from "@/hooks/use-language";
import { authClient } from "@/lib/auth-client";
import { getMessage } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { type AppLanguage, type MessageDictionary } from "@/types/i18n";

type NavbarProps = {
  messages: MessageDictionary;
  sessionUser: {
    email: string | null;
    name: string | null;
  } | null;
};

type NavLink = {
  href: string;
  icon: LucideIcon;
  label: string;
};

const HIDDEN_NAVBAR_PATHS = new Set(["/", "/login", "/sign-up"]);

function getNavLinks(messages: MessageDictionary): NavLink[] {
  return [
    {
      href: "/home",
      icon: LayoutDashboard,
      label: getMessage(messages, "shell.nav.home", "Workspace"),
    },
    {
      href: "/knowledge",
      icon: FileText,
      label: getMessage(messages, "shell.nav.knowledge", "Knowledge Base"),
    },
    {
      href: "/chat",
      icon: MessageSquare,
      label: getMessage(messages, "shell.nav.chat", "Chat"),
    },
  ];
}

function isActivePath(pathname: string, href: string) {
  if (href === "/home") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
export function LanguageToggle({ messages }: { messages: MessageDictionary }) {
  const router = useRouter();
  const { language, changeLanguage } = useLanguage();
  const currentLanguageLabel = language.toUpperCase();

  const handleLanguageChange = (nextLanguage: AppLanguage) => {
    if (nextLanguage === language) {
      return;
    }

    changeLanguage(nextLanguage);

    // Persist to DB so all app features (notifications, cross-device) stay in sync
    void fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language: nextLanguage }),
    });

    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label={getMessage(
              messages,
              "shell.language.groupLabel",
              "Language selector",
            )}
            className="cursor-pointer rounded-full border-border/70 bg-background/70 px-3 backdrop-blur-sm"
          >
            <Globe className="size-3.5" />
            {currentLanguageLabel}
          </Button>
        }
      />
      <DropdownMenuContent
        align="end"
        className="min-w-40 rounded-2xl border-border/70 bg-background/92 backdrop-blur-xl"
      >
        {(["de", "en"] as const).map((option) => {
          const label = option.toUpperCase();

          return (
            <DropdownMenuItem
              key={option}
              className="cursor-pointer rounded-xl"
              onClick={() => handleLanguageChange(option)}
            >
              <span className="flex w-full items-center justify-between gap-3">
                <span>{label}</span>
                {language === option ? (
                  <span className="text-xs text-muted-foreground">
                    {getMessage(messages, "shell.language.current", "Current")}
                  </span>
                ) : null}
              </span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function Navbar({ messages, sessionUser }: NavbarProps) {
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

  const navLinks = getNavLinks(messages);
  const userLabel =
    sessionUser?.name?.trim() ||
    sessionUser?.email ||
    getMessage(messages, "shell.nav.userFallback", "Workspace user");

  const handleSignOut = async () => {
    if (isSigningOut) {
      return;
    }

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
              {getMessage(messages, "auth.brandName", "See-Sweet")}
            </Link>

            <nav className="hidden min-[1000px]:flex min-[1000px]:items-center min-[1000px]:gap-2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = isActivePath(pathname, link.href);

                return (
                  <Button
                    key={link.href}
                    variant={isActive ? "secondary" : "ghost"}
                    size="sm"
                    className={cn(
                      "cursor-pointer rounded-full bg-transparent px-3",
                      isActive && "shadow-sm",
                    )}
                    nativeButton={false}
                    render={<Link href={link.href} />}
                  >
                    <Icon className="size-3.5" />
                    {link.label}
                  </Button>
                );
              })}
            </nav>

            <div className="ml-auto hidden items-center gap-2 min-[1000px]:flex">
              <NotificationPanel messages={messages} />
              <LanguageToggle messages={messages} />
              <ThemeToggle messages={messages} />
              <div className="rounded-full border border-border/70 bg-background/70 px-3 py-2 text-sm text-muted-foreground backdrop-blur-sm">
                {userLabel}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                aria-label={getMessage(
                  messages,
                  "shell.nav.signOut",
                  "Sign out",
                )}
                className="cursor-pointer rounded-full border-border/70 bg-background/70 px-3 backdrop-blur-sm"
                disabled={isSigningOut}
                onClick={handleSignOut}
              >
                <LogOut className="size-3.5" />
                {isSigningOut
                  ? getMessage(
                      messages,
                      "shell.nav.signingOut",
                      "Signing out...",
                    )
                  : getMessage(messages, "shell.nav.signOut", "Sign out")}
              </Button>
            </div>

            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label={getMessage(
                messages,
                isMenuOpen ? "shell.nav.closeMenu" : "shell.nav.openMenu",
                isMenuOpen ? "Close menu" : "Open menu",
              )}
              title={getMessage(
                messages,
                isMenuOpen ? "shell.nav.closeMenu" : "shell.nav.openMenu",
                isMenuOpen ? "Close menu" : "Open menu",
              )}
              className="cursor-pointer rounded-full border-border/70 bg-background/70 backdrop-blur-sm min-[1000px]:hidden"
              onClick={() => setIsMenuOpen((current) => !current)}
            >
              {isMenuOpen ? (
                <X className="size-4" />
              ) : (
                <Menu className="size-4" />
              )}
            </Button>
          </div>

          {isMenuOpen ? (
            <div className="mt-4 space-y-4 border-t border-border/60 pt-4 min-[1000px]:hidden">
              <nav className="grid gap-2">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = isActivePath(pathname, link.href);

                  return (
                    <Button
                      key={link.href}
                      variant={isActive ? "secondary" : "ghost"}
                      size="default"
                      className="cursor-pointer justify-start rounded-2xl bg-transparent px-4"
                      nativeButton={false}
                      render={<Link href={link.href} />}
                    >
                      <Icon className="size-4" />
                      {link.label}
                    </Button>
                  );
                })}
              </nav>

              <div className="flex flex-wrap items-center gap-2">
                <NotificationPanel messages={messages} />
                <LanguageToggle messages={messages} />
                <ThemeToggle messages={messages} />
              </div>

              <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-sm text-muted-foreground backdrop-blur-sm">
                {userLabel}
              </div>

              <Button
                type="button"
                variant="outline"
                className="cursor-pointer rounded-2xl border-border/70 bg-background/70 backdrop-blur-sm"
                disabled={isSigningOut}
                onClick={handleSignOut}
              >
                <LogOut className="size-4" />
                {isSigningOut
                  ? getMessage(
                      messages,
                      "shell.nav.signingOut",
                      "Signing out...",
                    )
                  : getMessage(messages, "shell.nav.signOut", "Sign out")}
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
