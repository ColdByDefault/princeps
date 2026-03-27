/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import {
  AuthShell,
  AUTH_PROVIDERS,
  getAuthMessage,
  OAuthProviderButtonGroup,
  type AuthProvider,
} from "@/components/auth/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { type MessageDictionary } from "@/types/i18n";

export default function LoginCard({
  messages,
}: {
  messages: MessageDictionary;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const { error: authError } = await authClient.signIn.email({
      email,
      password,
      callbackURL: "/home",
    });

    if (authError) {
      setError(
        authError.message ??
          getAuthMessage(messages, "auth.login.errorFallback"),
      );
      setLoading(false);
      return;
    }

    router.push("/home");
    router.refresh();
  }

  async function handleOAuth(provider: AuthProvider) {
    await authClient.signIn.social({ provider, callbackURL: "/home" });
  }

  return (
    <AuthShell
      badge={getAuthMessage(messages, "auth.login.badge")}
      brandName={getAuthMessage(messages, "auth.brandName")}
      heroBody={getAuthMessage(messages, "auth.login.heroBody")}
      heroPanelClassName="bg-linear-to-br from-primary/12 via-background to-background"
      heroPoints={[
        {
          body: getAuthMessage(messages, "auth.login.point.privateBody"),
          icon: ShieldCheck,
          title: getAuthMessage(messages, "auth.login.point.private"),
        },
        {
          body: getAuthMessage(messages, "auth.login.point.controlBody"),
          icon: SlidersHorizontal,
          title: getAuthMessage(messages, "auth.login.point.control"),
        },
      ]}
      heroTitle={getAuthMessage(messages, "auth.login.heroTitle")}
      form={
        <form
          onSubmit={handleSubmit}
          className="space-y-4"
          suppressHydrationWarning
        >
          <div className="space-y-2" suppressHydrationWarning>
            <label htmlFor="email" className="text-sm font-medium">
              {getAuthMessage(messages, "auth.login.emailLabel")}
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={getAuthMessage(
                messages,
                "auth.login.emailPlaceholder",
              )}
              className="h-11 rounded-xl bg-background/80"
            />
          </div>

          <div className="space-y-2" suppressHydrationWarning>
            <label htmlFor="password" className="text-sm font-medium">
              {getAuthMessage(messages, "auth.login.passwordLabel")}
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={getAuthMessage(
                  messages,
                  "auth.login.passwordPlaceholder",
                )}
                className="h-11 rounded-xl bg-background/80 pr-11"
              />
              <button
                type="button"
                aria-label={getAuthMessage(
                  messages,
                  showPassword ? "auth.password.hide" : "auth.password.show",
                )}
                aria-pressed={showPassword}
                title={getAuthMessage(
                  messages,
                  showPassword ? "auth.password.hide" : "auth.password.show",
                )}
                onClick={() => setShowPassword((current) => !current)}
                className="absolute top-1/2 right-3 inline-flex -translate-y-1/2 cursor-pointer items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none"
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <Button
            type="submit"
            disabled={loading}
            className="h-11 w-full cursor-pointer rounded-xl"
          >
            {loading
              ? getAuthMessage(messages, "auth.login.submitting")
              : getAuthMessage(messages, "auth.login.submit")}
            <ArrowRight className="size-4" />
          </Button>
        </form>
      }
      oauthSection={
        <OAuthProviderButtonGroup
          dividerLabel={getAuthMessage(messages, "auth.login.oauthDivider")}
          messages={messages}
          onProviderSelect={handleOAuth}
          providers={AUTH_PROVIDERS}
        />
      }
      subtitle={getAuthMessage(messages, "auth.login.subtitle")}
      title={getAuthMessage(messages, "auth.login.title")}
      footer={
        <p className="text-center text-sm text-muted-foreground">
          {getAuthMessage(messages, "auth.login.switchPrompt")}{" "}
          <Link
            href="/sign-up"
            className="cursor-pointer font-medium text-foreground hover:text-primary"
          >
            {getAuthMessage(messages, "auth.login.switchLink")}
          </Link>
        </p>
      }
    />
  );
}
