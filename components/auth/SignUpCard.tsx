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
  Brain,
  Eye,
  EyeOff,
  FolderKanban,
  Sparkles,
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

export default function SignUpCard({
  messages,
}: {
  messages: MessageDictionary;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const { error: authError } = await authClient.signUp.email({
      name,
      email,
      password,
      callbackURL: "/home",
    });

    if (authError) {
      setError(
        authError.message ??
          getAuthMessage(messages, "auth.signUp.errorFallback"),
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
      badge={getAuthMessage(messages, "auth.signUp.badge")}
      brandName={getAuthMessage(messages, "auth.brandName")}
      heroBody={getAuthMessage(messages, "auth.signUp.heroBody")}
      heroPanelClassName="bg-background"
      heroPoints={[
        {
          body: getAuthMessage(messages, "auth.signUp.point.fastBody"),
          icon: Sparkles,
          title: getAuthMessage(messages, "auth.signUp.point.fast"),
        },
        {
          body: getAuthMessage(messages, "auth.signUp.point.organizedBody"),
          icon: FolderKanban,
          title: getAuthMessage(messages, "auth.signUp.point.organized"),
        },
        {
          body: getAuthMessage(messages, "auth.signUp.point.controlBody"),
          icon: Brain,
          title: getAuthMessage(messages, "auth.signUp.point.control"),
        },
      ]}
      heroTitle={getAuthMessage(messages, "auth.signUp.heroTitle")}
      form={
        <form
          onSubmit={handleSubmit}
          className="space-y-4"
          suppressHydrationWarning
        >
          <div className="space-y-2" suppressHydrationWarning>
            <label htmlFor="name" className="text-sm font-medium">
              {getAuthMessage(messages, "auth.signUp.nameLabel")}
            </label>
            <Input
              id="name"
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={getAuthMessage(
                messages,
                "auth.signUp.namePlaceholder",
              )}
              className="h-11 rounded-xl bg-background/80"
            />
          </div>

          <div className="space-y-2" suppressHydrationWarning>
            <label htmlFor="email" className="text-sm font-medium">
              {getAuthMessage(messages, "auth.signUp.emailLabel")}
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
                "auth.signUp.emailPlaceholder",
              )}
              className="h-11 rounded-xl bg-background/80"
            />
          </div>

          <div className="space-y-2" suppressHydrationWarning>
            <label htmlFor="password" className="text-sm font-medium">
              {getAuthMessage(messages, "auth.signUp.passwordLabel")}
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={getAuthMessage(
                  messages,
                  "auth.signUp.passwordPlaceholder",
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
                className="absolute top-1/2 right-3 inline-flex -translate-y-1/2 items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none"
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
            className="h-11 w-full rounded-xl"
          >
            {loading
              ? getAuthMessage(messages, "auth.signUp.submitting")
              : getAuthMessage(messages, "auth.signUp.submit")}
            <ArrowRight className="size-4" />
          </Button>
        </form>
      }
      oauthSection={
        <OAuthProviderButtonGroup
          dividerLabel={getAuthMessage(messages, "auth.signUp.oauthDivider")}
          messages={messages}
          onProviderSelect={handleOAuth}
          providers={AUTH_PROVIDERS}
        />
      }
      subtitle={getAuthMessage(messages, "auth.signUp.subtitle")}
      title={getAuthMessage(messages, "auth.signUp.title")}
      footer={
        <p className="text-center text-sm text-muted-foreground">
          {getAuthMessage(messages, "auth.signUp.switchPrompt")}{" "}
          <Link
            href="/login"
            className="font-medium text-foreground hover:text-primary"
          >
            {getAuthMessage(messages, "auth.signUp.switchLink")}
          </Link>
        </p>
      }
    />
  );
}
