/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import { Github, type LucideIcon } from "lucide-react";
import { type ComponentType, type ReactNode, type SVGProps } from "react";
import { Button } from "@/components/ui/button";
import { type MessageDictionary } from "@/types/i18n";

export type AuthProvider = "google" | "github" | "microsoft" | "apple";

export const AUTH_PROVIDERS = [
  // "google",
  // "github",
  // "microsoft",
  // "apple",
] as const satisfies readonly AuthProvider[];

const AUTH_PROVIDER_MESSAGE_KEYS: Record<AuthProvider, string> = {
  apple: "auth.providers.apple",
  github: "auth.providers.github",
  google: "auth.providers.google",
  microsoft: "auth.providers.microsoft",
};

type ProviderIcon = ComponentType<SVGProps<SVGSVGElement>>;

type AuthHeroPoint = {
  body: string;
  icon: LucideIcon;
  title: string;
};

type AuthShellProps = {
  badge: string;
  brandName: string;
  footer: ReactNode;
  form: ReactNode;
  heroBody: string;
  heroPanelClassName: string;
  heroPoints: AuthHeroPoint[];
  heroTitle: string;
  oauthSection: ReactNode;
  subtitle: string;
  title: string;
};

type OAuthProviderButtonGroupProps = {
  dividerLabel: string;
  messages: MessageDictionary;
  onProviderSelect: (provider: AuthProvider) => void;
  providers?: readonly AuthProvider[];
};

function GoogleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M21.805 12.225c0-.664-.058-1.295-.165-1.9H12v3.59h5.51a4.71 4.71 0 0 1-2.044 3.09v2.57h3.313c1.938-1.785 3.026-4.418 3.026-7.35Z"
        fill="#4285F4"
      />
      <path
        d="M12 22c2.76 0 5.074-.915 6.766-2.475l-3.313-2.57c-.918.615-2.094.98-3.453.98-2.654 0-4.9-1.79-5.704-4.2H2.873v2.65A10.21 10.21 0 0 0 12 22Z"
        fill="#34A853"
      />
      <path
        d="M6.296 13.735A6.12 6.12 0 0 1 5.977 12c0-.602.115-1.185.319-1.735V7.615H2.873A10.21 10.21 0 0 0 1.8 12c0 1.64.392 3.19 1.073 4.385l3.423-2.65Z"
        fill="#FBBC05"
      />
      <path
        d="M12 6.065c1.5 0 2.846.516 3.907 1.53l2.93-2.93C17.069 2.98 14.755 2 12 2A10.21 10.21 0 0 0 2.873 7.615l3.423 2.65c.804-2.41 3.05-4.2 5.704-4.2Z"
        fill="#EA4335"
      />
    </svg>
  );
}

function MicrosoftIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <rect x="3" y="3" width="8" height="8" fill="#F25022" />
      <rect x="13" y="3" width="8" height="8" fill="#7FBA00" />
      <rect x="3" y="13" width="8" height="8" fill="#00A4EF" />
      <rect x="13" y="13" width="8" height="8" fill="#FFB900" />
    </svg>
  );
}

function AppleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M15.178 3.147c0 1.09-.453 2.153-1.153 2.877-.728.752-1.926 1.296-2.963 1.212-.136-1.027.376-2.113 1.084-2.832.738-.766 1.987-1.325 3.032-1.257Z"
        fill="currentColor"
      />
      <path
        d="M18.78 12.57c.02 2.004 1.76 2.67 1.78 2.678-.015.047-.278.955-.915 1.89-.55.81-1.12 1.617-2.017 1.633-.882.017-1.166-.523-2.174-.523-1.01 0-1.325.507-2.156.54-.865.034-1.523-.873-2.077-1.678-1.13-1.64-1.995-4.636-.835-6.68.576-1.016 1.605-1.657 2.722-1.674.849-.016 1.65.572 2.174.572.523 0 1.505-.707 2.535-.603.431.018 1.64.174 2.42 1.315-.063.04-1.45.842-1.457 2.53Z"
        fill="currentColor"
        opacity="0.82"
      />
    </svg>
  );
}

const AUTH_PROVIDER_META: Record<AuthProvider, { icon: ProviderIcon }> = {
  apple: {
    icon: AppleIcon,
  },
  github: {
    icon: Github,
  },
  google: {
    icon: GoogleIcon,
  },
  microsoft: {
    icon: MicrosoftIcon,
  },
};

const AUTH_PROVIDER_ICON_CLASSNAMES: Record<AuthProvider, string> = {
  apple: "text-[#111111] dark:text-white",
  github: "text-[#181717] dark:text-white",
  google: "",
  microsoft: "",
};

export function getAuthMessage(
  messages: MessageDictionary,
  key: string,
): string {
  return messages[key] ?? "";
}

export function AuthShell({
  badge,
  brandName,
  footer,
  form,
  heroBody,
  heroPanelClassName,
  heroPoints,
  heroTitle,
  oauthSection,
  subtitle,
  title,
}: AuthShellProps) {
  return (
    <div className="grid overflow-hidden rounded-[2rem] border border-border/70 bg-card/75 shadow-2xl shadow-black/10 backdrop-blur xl:grid-cols-[1.05fr_0.95fr]">
      <div
        className={`relative hidden border-r border-border/70 p-8 xl:flex xl:flex-col xl:justify-between ${heroPanelClassName}`}
      >
        <div aria-hidden className="absolute inset-0 opacity-70" />
        <div className="relative space-y-6">
          <p className="text-xs font-semibold tracking-[0.32em] text-muted-foreground uppercase">
            {badge}
          </p>
          <div className="space-y-3">
            <h1 className="max-w-md text-4xl font-semibold tracking-tight text-balance">
              {heroTitle}
            </h1>
            <p className="max-w-lg text-sm leading-6 text-muted-foreground">
              {heroBody}
            </p>
          </div>
        </div>

        <div className="relative grid gap-3">
          {heroPoints.map(({ body, icon: Icon, title }) => (
            <div
              key={title}
              className="flex items-start gap-3 rounded-2xl border border-border/60 bg-background/70 p-4"
            >
              <Icon className="mt-0.5 size-4 text-primary" />
              <div>
                <p className="text-sm font-medium">{title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 sm:p-8 lg:p-10">
        <div className="mx-auto w-full max-w-md space-y-6">
          <div className="space-y-2">
            <p className="text-xs font-semibold tracking-[0.28em] text-muted-foreground uppercase">
              {brandName}
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-balance">
              {title}
            </h2>
            <p className="text-sm leading-6 text-muted-foreground">
              {subtitle}
            </p>
          </div>

          {form}
          {oauthSection}
          {footer}
        </div>
      </div>
    </div>
  );
}

export function OAuthProviderButtonGroup({
  dividerLabel,
  messages,
  onProviderSelect,
  providers = AUTH_PROVIDERS,
}: OAuthProviderButtonGroupProps) {
  if (providers.length === 0) {
    return null;
  }

  return (
    <>
      <div className="relative py-1">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border/70" />
        </div>
        <div className="relative flex justify-center text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
          <span className="bg-card px-3">{dividerLabel}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {providers.map((provider) =>
          (() => {
            const { icon: Icon } = AUTH_PROVIDER_META[provider];
            const label = getAuthMessage(
              messages,
              AUTH_PROVIDER_MESSAGE_KEYS[provider],
            );

            return (
              <Button
                key={provider}
                type="button"
                variant="outline"
                onClick={() => onProviderSelect(provider)}
                className="h-11 justify-start gap-2 rounded-xl px-4"
              >
                <Icon
                  className={`size-4 shrink-0 ${AUTH_PROVIDER_ICON_CLASSNAMES[provider]}`}
                />
                <span>{label}</span>
              </Button>
            );
          })(),
        )}
      </div>
    </>
  );
}
