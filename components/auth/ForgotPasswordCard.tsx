/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version beta
 * @since beta
 * @module
 * @description
 */

"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ArrowRight, CheckCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { AuthShell } from "@/components/auth/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth/auth-client";
import { forgetPasswordSchema } from "@/lib/auth/auth-schemas";

export default function ForgotPasswordCard() {
  const t = useTranslations("auth");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const result = forgetPasswordSchema.safeParse({ email });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setLoading(true);

    const { error: authError } = await authClient.requestPasswordReset({
      email,
      redirectTo: "/reset-password",
    });

    setLoading(false);

    if (authError) {
      setError(authError.message ?? t("forgotPassword.errorFallback"));
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <AuthShell
        title={t("forgotPassword.successTitle")}
        subtitle={t("forgotPassword.successMessage")}
        form={
          <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
            <CheckCircle className="size-4 shrink-0 text-green-500" />
            <span>{t("forgotPassword.successMessage")}</span>
          </div>
        }
        footer={
          <p className="text-center text-sm text-muted-foreground">
            <Link
              href="/login"
              className="cursor-pointer font-medium text-foreground hover:text-primary"
            >
              {t("forgotPassword.backToLogin")}
            </Link>
          </p>
        }
      />
    );
  }

  return (
    <AuthShell
      title={t("forgotPassword.title")}
      subtitle={t("forgotPassword.subtitle")}
      form={
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              {t("forgotPassword.emailLabel")}
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={t("forgotPassword.emailPlaceholder")}
              className="h-11 rounded-xl bg-background/80"
            />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <Button
            type="submit"
            disabled={loading}
            className="h-11 w-full cursor-pointer rounded-xl"
          >
            {loading
              ? t("forgotPassword.submitting")
              : t("forgotPassword.submit")}
            <ArrowRight className="size-4" />
          </Button>
        </form>
      }
      footer={
        <p className="text-center text-sm text-muted-foreground">
          <Link
            href="/login"
            className="cursor-pointer font-medium text-foreground hover:text-primary"
          >
            {t("forgotPassword.backToLogin")}
          </Link>
        </p>
      }
    />
  );
}
