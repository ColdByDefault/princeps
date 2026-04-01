/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Briefcase,
  Bot,
  ChevronDown,
  ClipboardList,
  ContactRound,
  FileText,
  GitFork,
  Globe,
  CalendarDays,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Search,
  Settings,
  SlidersHorizontal,
  X,
  type LucideIcon,
  CheckSquare,
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
    role?: string | null;
    tier?: string | null;
  } | null;
};

function PlanBadge({
  tier,
  messages,
}: {
  tier: string;
  messages: MessageDictionary;
}) {
  const isFree = tier === "free";
  const label = getMessage(
    messages,
    tier === "pro"
      ? "shell.nav.planPro"
      : tier === "premium"
        ? "shell.nav.planPremium"
        : "shell.nav.planFree",
    tier,
  );

  return (
    <>
      <span
        className={cn(
          "rounded-full px-2 py-0.5 text-[10px] font-medium tracking-wide",
          isFree
            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
            : tier === "premium"
              ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
              : "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
        )}
      >
        {label}
      </span>
      {isFree && (
        <Link
          href="/settings/app"
          className="cursor-pointer text-[10px] font-medium text-primary underline-offset-2 hover:underline"
        >
          {getMessage(messages, "shell.nav.upgrade", "Upgrade")}
        </Link>
      )}
    </>
  );
}

type NavLink = {
  href: string;
  icon: LucideIcon;
  label: string;
};

const HIDDEN_NAVBAR_PATHS = new Set(["/", "/login", "/sign-up"]);
const GROUP_HREFS = new Set([
  "/contacts",
  "/meetings",
  "/tasks",
  "/decisions",
  "/knowledge",
]);
const SETTINGS_HREFS = new Set([
  "/settings/app",
  "/settings/assistant",
  "/reports",
]);

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
    {
      href: "/contacts",
      icon: ContactRound,
      label: getMessage(messages, "shell.nav.contacts", "Contacts"),
    },
    {
      href: "/meetings",
      icon: CalendarDays,
      label: getMessage(messages, "shell.nav.meetings", "Meetings"),
    },
    {
      href: "/tasks",
      icon: CheckSquare,
      label: getMessage(messages, "shell.nav.tasks", "Tasks"),
    },
    {
      href: "/decisions",
      icon: GitFork,
      label: getMessage(messages, "shell.nav.decisions", "Decisions"),
    },
    {
      href: "/settings/app",
      icon: SlidersHorizontal,
      label: getMessage(messages, "shell.nav.appSettings", "App Settings"),
    },
    {
      href: "/settings/assistant",
      icon: Bot,
      label: getMessage(messages, "shell.nav.assistantSettings", "Assistant"),
    },
    {
      href: "/reports",
      icon: ClipboardList,
      label: getMessage(messages, "shell.nav.reports", "Reports"),
    },
  ];
}

function isActivePath(pathname: string, href: string) {
  if (href === "/home") {
    return pathname === href;
  }
  if (href === "/settings/app") {
    return (
      pathname === "/settings/app" || pathname.startsWith("/settings/app/")
    );
  }
  if (href === "/settings/assistant") {
    return (
      pathname === "/settings/assistant" ||
      pathname.startsWith("/settings/assistant/")
    );
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
            className="cursor-pointer rounded-full border-border/70 bg-background/70 px-2.5 backdrop-blur-sm"
            title={currentLanguageLabel}
          >
            <Globe className="size-3.5" />
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

  const isAdmin = sessionUser?.role === "admin";
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
                if (link.href === "/contacts") {
                  const groupLinks = navLinks.filter((l) =>
                    GROUP_HREFS.has(l.href),
                  );
                  const isGroupActive = groupLinks.some((l) =>
                    isActivePath(pathname, l.href),
                  );
                  return (
                    <DropdownMenu key="organize-group">
                      <DropdownMenuTrigger
                        render={
                          <Button
                            type="button"
                            variant={isGroupActive ? "secondary" : "ghost"}
                            size="sm"
                            aria-label={getMessage(
                              messages,
                              "shell.nav.organize",
                              "Organize",
                            )}
                            className={cn(
                              "cursor-pointer rounded-full bg-transparent px-3",
                              isGroupActive && "shadow-sm",
                            )}
                          >
                            <Briefcase className="size-3.5" />
                            {getMessage(
                              messages,
                              "shell.nav.organize",
                              "Organize",
                            )}
                            <ChevronDown className="size-3 opacity-60" />
                          </Button>
                        }
                      />
                      <DropdownMenuContent
                        align="start"
                        className="min-w-44 rounded-2xl border-border/70 bg-background/92 backdrop-blur-xl"
                      >
                        {groupLinks.map((groupLink) => {
                          const GIcon = groupLink.icon;
                          const isLinkActive = isActivePath(
                            pathname,
                            groupLink.href,
                          );
                          return (
                            <DropdownMenuItem
                              key={groupLink.href}
                              className={cn(
                                "cursor-pointer rounded-xl gap-2",
                                isLinkActive &&
                                  "bg-accent text-accent-foreground",
                              )}
                              onClick={() => router.push(groupLink.href)}
                            >
                              <GIcon className="size-4" />
                              {groupLink.label}
                            </DropdownMenuItem>
                          );
                        })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  );
                }
                if (GROUP_HREFS.has(link.href)) return null;

                if (link.href === "/settings/app") {
                  const settingsLinks = navLinks.filter((l) =>
                    SETTINGS_HREFS.has(l.href),
                  );
                  const isSettingsActive = settingsLinks.some((l) =>
                    isActivePath(pathname, l.href),
                  );
                  return (
                    <DropdownMenu key="settings-group">
                      <DropdownMenuTrigger
                        render={
                          <Button
                            type="button"
                            variant={isSettingsActive ? "secondary" : "ghost"}
                            size="sm"
                            aria-label={getMessage(
                              messages,
                              "shell.nav.settings",
                              "Settings",
                            )}
                            className={cn(
                              "cursor-pointer rounded-full bg-transparent px-3",
                              isSettingsActive && "shadow-sm",
                            )}
                          >
                            <Settings className="size-3.5" />
                            {getMessage(
                              messages,
                              "shell.nav.settings",
                              "Settings",
                            )}
                            <ChevronDown className="size-3 opacity-60" />
                          </Button>
                        }
                      />
                      <DropdownMenuContent
                        align="start"
                        className="min-w-44 rounded-2xl border-border/70 bg-background/92 backdrop-blur-xl"
                      >
                        {settingsLinks.map((settingsLink) => {
                          const SIcon = settingsLink.icon;
                          const isLinkActive = isActivePath(
                            pathname,
                            settingsLink.href,
                          );
                          return (
                            <DropdownMenuItem
                              key={settingsLink.href}
                              className={cn(
                                "cursor-pointer rounded-xl gap-2",
                                isLinkActive &&
                                  "bg-accent text-accent-foreground",
                              )}
                              onClick={() => router.push(settingsLink.href)}
                            >
                              <SIcon className="size-4" />
                              {settingsLink.label}
                            </DropdownMenuItem>
                          );
                        })}
                        {isAdmin && (
                          <DropdownMenuItem
                            className={cn(
                              "cursor-pointer rounded-xl gap-2",
                              isActivePath(pathname, "/admin") &&
                                "bg-accent text-accent-foreground",
                            )}
                            onClick={() => router.push("/admin")}
                          >
                            <SlidersHorizontal className="size-4" />
                            {getMessage(messages, "shell.nav.admin", "Admin")}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  );
                }
                if (SETTINGS_HREFS.has(link.href)) return null;

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
              <Button
                type="button"
                variant="outline"
                size="sm"
                aria-label={getMessage(
                  messages,
                  "shell.search.trigger",
                  "Search workspace",
                )}
                title={getMessage(
                  messages,
                  "shell.search.trigger",
                  "Search workspace",
                )}
                className="cursor-pointer justify-start rounded-full border-border/70 bg-background/70 px-3 min-w-32 min-[1150px]:min-w-52 min-[1280px]:min-w-64 backdrop-blur-sm"
                onClick={() =>
                  window.dispatchEvent(new Event("global-search:open"))
                }
              >
                <Search className="size-3.5" />
                <span className="text-muted-foreground">
                  {getMessage(messages, "shell.search.triggerLabel", "Search…")}
                </span>
                <kbd className="pointer-events-none ml-auto hidden select-none rounded border border-border/70 bg-muted px-2 py-0.5 text-xs font-mono text-muted-foreground sm:inline-flex">
                  ⌘K
                </kbd>
              </Button>
              <NotificationPanel messages={messages} />
              <LanguageToggle messages={messages} />
              <ThemeToggle messages={messages} />
              {sessionUser.tier && (
                <div className="flex items-center rounded-full px-2.5 py-1.5 backdrop-blur-sm">
                  <PlanBadge tier={sessionUser.tier} messages={messages} />
                </div>
              )}
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                aria-label={getMessage(
                  messages,
                  isSigningOut ? "shell.nav.signingOut" : "shell.nav.signOut",
                  isSigningOut ? "Signing out..." : "Sign out",
                )}
                title={getMessage(
                  messages,
                  isSigningOut ? "shell.nav.signingOut" : "shell.nav.signOut",
                  isSigningOut ? "Signing out..." : "Sign out",
                )}
                className="cursor-pointer rounded-full border-border/70 bg-background/70 backdrop-blur-sm"
                disabled={isSigningOut}
                onClick={handleSignOut}
              >
                <LogOut className="size-3.5" />
              </Button>
            </div>

            <div className="ml-auto flex items-center gap-2 min-[1000px]:hidden">
              <Button
                type="button"
                variant="outline"
                size="sm"
                aria-label={getMessage(
                  messages,
                  "shell.search.trigger",
                  "Search workspace",
                )}
                className="cursor-pointer rounded-full border-border/70 bg-background/70 px-2.5 backdrop-blur-sm"
                onClick={() =>
                  window.dispatchEvent(new Event("global-search:open"))
                }
              >
                <Search className="size-3.5" />
                <kbd className="pointer-events-none select-none rounded border border-border/70 bg-muted px-1.5 py-0.5 text-xs font-mono text-muted-foreground">
                  ⌘K
                </kbd>
              </Button>
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
                className="cursor-pointer rounded-full border-border/70 bg-background/70 backdrop-blur-sm"
                onClick={() => setIsMenuOpen((current) => !current)}
              >
                {isMenuOpen ? (
                  <X className="size-4" />
                ) : (
                  <Menu className="size-4" />
                )}
              </Button>
            </div>
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

              <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/70 px-4 py-3 backdrop-blur-sm">
                <span className="truncate text-sm text-muted-foreground">
                  {userLabel}
                </span>
                {sessionUser.tier && (
                  <div className="ml-3 flex shrink-0 items-center gap-1.5">
                    <PlanBadge tier={sessionUser.tier} messages={messages} />
                  </div>
                )}
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
