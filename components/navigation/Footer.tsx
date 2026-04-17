/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * SPDX-License-Identifier: Elastic-2.0
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import VersionDisplay from "@/components/VersionDisplay";

const HIDDEN_FOOTER_PATHS = new Set(["/", "/login", "/sign-up"]);

type FooterLink = {
  href: string;
  label: string;
};

export default function Footer() {
  const t = useTranslations("shell");
  const pathname = usePathname();

  if (HIDDEN_FOOTER_PATHS.has(pathname) || pathname.startsWith("/chat")) {
    return null;
  }

  const workspaceLinks: FooterLink[] = [
    { href: "/home", label: t("nav.home") },
  ];
  const policyLinks: FooterLink[] = [
    { href: "/privacy-policy", label: t("footer.privacyPolicy") },
    { href: "/terms-of-use", label: t("footer.termsOfUse") },
    { href: "/security", label: t("footer.security") },
  ];

  const allLinks = [...workspaceLinks, ...policyLinks];

  return (
    <footer className="border-t border-border/70 bg-background/95 px-6 py-3 backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {allLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="cursor-pointer text-xs text-muted-foreground transition hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <VersionDisplay
            className="text-xs text-muted-foreground"
            titleLabel={t("footer.versionTitle")}
          />
          <span className="inline-flex items-center bg-amber-500/10 px-2 py-0.5 text-[0.65rem] font-semibold tracking-[0.18em] text-amber-700 uppercase dark:text-amber-300">
            {t("footer.beta")}
          </span>
          <span className="text-xs text-muted-foreground">
            | {t("footer.copyright")} |
          </span>
          <span className="text-xs text-muted-foreground">
            {t("footer.authors")}
          </span>
        </div>
      </div>
    </footer>
  );
}
