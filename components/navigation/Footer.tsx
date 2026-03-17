/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import Link from "next/link";
import VersionDisplay from "@/components/VersionDisplay";
import { getMessage } from "@/lib/i18n";
import { type MessageDictionary } from "@/types/i18n";

type FooterProps = {
  messages: MessageDictionary;
};

type FooterLink = {
  href: string;
  label: string;
};

function getWorkspaceLinks(messages: MessageDictionary): FooterLink[] {
  return [
    {
      href: "/home",
      label: getMessage(messages, "shell.nav.home", "Workspace"),
    },
    {
      href: "/meetings",
      label: getMessage(messages, "shell.nav.meetings", "Meetings"),
    },
  ];
}

function getPolicyLinks(messages: MessageDictionary): FooterLink[] {
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

export default function Footer({ messages }: FooterProps) {
  const workspaceLinks = getWorkspaceLinks(messages);
  const policyLinks = getPolicyLinks(messages);

  return (
    <footer className="px-4 pb-6 sm:px-6 lg:px-8">
      <div className="mx-auto mt-8 max-w-7xl rounded-[2rem] border border-black/8 bg-white/42 px-6 py-5 backdrop-blur-xl dark:border-white/10 dark:bg-black/28">
        <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-start">
          <FooterColumn
            title={getMessage(messages, "shell.footer.workspace", "Workspace")}
            links={workspaceLinks}
          />

          <FooterColumn
            title={getMessage(messages, "shell.footer.placeholderLinks", "Policies")}
            links={policyLinks}
          />

          <div className="space-y-3 lg:text-right">
            <p className="text-xs font-semibold tracking-[0.22em] uppercase text-muted-foreground">
              {getMessage(messages, "auth.brandName", "See-Sweet")}
            </p>
            <VersionDisplay
              className="block text-sm text-muted-foreground"
              titleLabel={getMessage(
                messages,
                "shell.footer.versionTitle",
                "Application version",
              )}
            />
            <p className="text-sm text-muted-foreground">
              {getMessage(messages, "shell.footer.copyright", "Copyright")}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}