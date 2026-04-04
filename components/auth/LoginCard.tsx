/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ArrowRight, Eye, EyeOff, Info } from "lucide-react";
import { useTranslations } from "next-intl";
import { AuthShell } from "@/components/auth/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth/auth-client";
import { signInSchema } from "@/lib/auth/auth-schemas";

export default function LoginCard() {
  const t = useTranslations("auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const result = signInSchema.safeParse({ email, password });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setLoading(true);

    const { error: authError } = await authClient.signIn.email({
      email,
      password,
      callbackURL: callbackUrl ?? "/home",
    });

    if (authError) {
      setError(authError.message ?? t("login.errorFallback"));
      setLoading(false);
      return;
    }

    router.push(callbackUrl ?? "/home");
    router.refresh();
  }

  return (
    <AuthShell
      title={t("login.title")}
      subtitle={t("login.subtitle")}
      form={
        <form onSubmit={handleSubmit} className="space-y-4">
          {callbackUrl ? (
            <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2.5 text-sm text-muted-foreground">
              <Info className="mt-0.5 size-4 shrink-0" />
              <span>{t("login.redirectNotice")}</span>
            </div>
          ) : null}

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              {t("login.emailLabel")}
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={t("login.emailPlaceholder")}
              className="h-11 rounded-xl bg-background/80"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              {t("login.passwordLabel")}
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={t("login.passwordPlaceholder")}
                className="h-11 rounded-xl bg-background/80 pr-11"
              />
              <button
                type="button"
                aria-label={t(showPassword ? "password.hide" : "password.show")}
                aria-pressed={showPassword}
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
            {loading ? t("login.submitting") : t("login.submit")}
            <ArrowRight className="size-4" />
          </Button>
        </form>
      }
      footer={
        <p className="text-center text-sm text-muted-foreground">
          {t("login.switchPrompt")}{" "}
          <Link
            href="/sign-up"
            className="cursor-pointer font-medium text-foreground hover:text-primary"
          >
            {t("login.switchLink")}
          </Link>
        </p>
      }
    />
  );
}
