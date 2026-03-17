/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  CalendarDays,
  Globe,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  X,
  type LucideIcon,
} from "lucide-react";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/use-language";
import { authClient } from "@/lib/auth-client";
import { getMessage } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { type AppLanguage, type MessageDictionary } from "@/types/i18n";

type AppShellProps = {
  children: React.ReactNode;
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

type FooterLink = {
  href: string;
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
      href: "/meetings",
      icon: CalendarDays,
      label: getMessage(messages, "shell.nav.meetings", "Meetings"),
    },
    {
      href: "/meetings/new",
      icon: Plus,
      label: getMessage(messages, "shell.nav.newMeeting", "New meeting"),
    },
  ];
}

function getFooterLinks(messages: MessageDictionary): FooterLink[] {
  return [
    {
      href: "/privacy-policy",
      label: getMessage(
        messages,
        "shell.footer.privacyPolicy",
        "Privacy policy",
      ),
    },
    {
      href: "/terms-of-use",
      label: getMessage(messages, "shell.footer.termsOfUse", "Terms of use"),
    },
    {
      href: "/security",
      label: getMessage(messages, "shell.footer.security", "Security"),
    },
  ];
}

function isActivePath(pathname: string, href: string) {
  if (href === "/home") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function LanguageToggle({ messages }: { messages: MessageDictionary }) {
  const router = useRouter();
  const { language, changeLanguage } = useLanguage();
  const groupLabel = getMessage(
    messages,
    "shell.language.groupLabel",
    "Language selector",
  );

  const handleLanguageChange = (nextLanguage: AppLanguage) => {
    if (nextLanguage === language) {
      return;
    }

    changeLanguage(nextLanguage);
    router.refresh();
  };

  return (
    <div
      role="group"
      aria-label={groupLabel}
      className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-background/70 p-1 backdrop-blur-sm"
    >
      <span className="pl-2 text-muted-foreground">
        <Globe className="size-3.5" />
      </span>
      {(["de", "en"] as const).map((option) => {
        const isActive = language === option;
        const label = getMessage(
          messages,
          `shell.language.${option}`,
          option.toUpperCase(),
        );

        return (
          <Button
            key={option}
            type="button"
            size="xs"
            variant={isActive ? "default" : "ghost"}
            aria-label={label}
            aria-pressed={isActive}
            title={label}
            className="cursor-pointer rounded-full px-2.5 uppercase"
            onClick={() => handleLanguageChange(option)}
          >
            {option}
          </Button>
        );
      })}
    </div>
  );
}

function Navbar({
  messages,
  pathname,
  sessionUser,
}: {
  messages: MessageDictionary;
  pathname: string;
  sessionUser: AppShellProps["sessionUser"];
}) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
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
        <div className="rounded-[1.75rem] border border-black/8 bg-white/58 px-4 py-3 shadow-lg shadow-black/5 backdrop-blur-xl dark:border-white/10 dark:bg-black/42">
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
                      "cursor-pointer rounded-full px-3",
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
                className="cursor-pointer rounded-full px-3"
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
              className="cursor-pointer rounded-full min-[1000px]:hidden"
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
                      className="cursor-pointer justify-start rounded-2xl px-4"
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
                <LanguageToggle messages={messages} />
                <ThemeToggle messages={messages} />
              </div>

              <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-sm text-muted-foreground">
                {userLabel}
              </div>

              <Button
                type="button"
                variant="outline"
                className="cursor-pointer rounded-2xl"
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

function Footer({ messages }: { messages: MessageDictionary }) {
  const navLinks = getNavLinks(messages);
  const footerLinks = getFooterLinks(messages);

  return (
    <footer className="px-4 pb-6 sm:px-6 lg:px-8">
      <div className="mx-auto mt-8 max-w-7xl rounded-[2rem] border border-black/8 bg-white/42 px-6 py-5 backdrop-blur-xl dark:border-white/10 dark:bg-black/28">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl space-y-2">
            <p className="text-sm font-semibold tracking-[0.24em] uppercase text-foreground">
              {getMessage(messages, "auth.brandName", "See-Sweet")}
            </p>
            <p className="text-sm leading-6 text-muted-foreground">
              {getMessage(
                messages,
                "shell.footer.description",
                "Private executive workspace for continuity, preparation, and follow-through.",
              )}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[auto_auto] lg:gap-10">
            <div className="space-y-3">
              <p className="text-xs font-semibold tracking-[0.22em] uppercase text-muted-foreground">
                {getMessage(messages, "shell.footer.workspace", "Workspace")}
              </p>
              <div className="flex flex-wrap gap-2">
                {navLinks.map((link) => (
                  <Button
                    key={link.href}
                    variant="ghost"
                    size="sm"
                    className="cursor-pointer rounded-full px-0 text-sm text-muted-foreground hover:text-foreground"
                    nativeButton={false}
                    render={<Link href={link.href} />}
                  >
                    {link.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold tracking-[0.22em] uppercase text-muted-foreground">
                {getMessage(
                  messages,
                  "shell.footer.placeholderLinks",
                  "Policies",
                )}
              </p>
              <div className="flex flex-wrap gap-2">
                {footerLinks.map((link) => (
                  <Button
                    key={link.href}
                    variant="ghost"
                    size="sm"
                    className="cursor-pointer rounded-full px-0 text-sm text-muted-foreground hover:text-foreground"
                    nativeButton={false}
                    render={<Link href={link.href} />}
                  >
                    {link.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function AppShell({
  children,
  messages,
  sessionUser,
}: AppShellProps) {
  const pathname = usePathname();
  const showNavbar = !HIDDEN_NAVBAR_PATHS.has(pathname);

  return (
    <>
      {showNavbar ? (
        <Navbar
          key={pathname}
          messages={messages}
          pathname={pathname}
          sessionUser={sessionUser}
        />
      ) : null}
      <div className="flex flex-1 flex-col">{children}</div>
      <Footer messages={messages} />
    </>
  );
}
