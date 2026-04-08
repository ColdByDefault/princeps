/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
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

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: FooterLink[];
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold tracking-[0.22em] uppercase text-muted-foreground">
        {title}
      </p>
      <div className="flex flex-col items-start gap-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="cursor-pointer text-sm text-muted-foreground transition hover:text-foreground"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

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

  return (
    <footer className="px-4 pb-6 sm:px-6 lg:px-8">
      <div className="mx-auto mt-8 max-w-7xl rounded-[2rem] border border-black/8 bg-white/42 px-6 py-5 backdrop-blur-xl dark:border-white/10 dark:bg-black/28">
        <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-start">
          <FooterColumn title={t("footer.workspace")} links={workspaceLinks} />

          <FooterColumn
            title={t("footer.placeholderLinks")}
            links={policyLinks}
          />

          <div className="flex flex-col lg:text-right ">
            <div className="flex items-center gap-2 lg:justify-end">
              <VersionDisplay
                className="block text-sm text-muted-foreground"
                titleLabel={t("footer.versionTitle")}
              />
              <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-[0.65rem] font-semibold tracking-[0.18em] text-amber-700 uppercase dark:text-amber-300">
                {t("footer.beta")}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-auto">
              {t("footer.copyright")}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
