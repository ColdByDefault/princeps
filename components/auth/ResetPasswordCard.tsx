/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * SPDX-License-Identifier: Elastic-2.0
 */

"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ArrowRight, CheckCircle, Eye, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { AuthShell } from "@/components/auth/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth/auth-client";
import { resetPasswordSchema } from "@/lib/auth/auth-schemas";

export default function ResetPasswordCard() {
  const t = useTranslations("auth");
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <AuthShell
        title={t("resetPassword.title")}
        subtitle={t("resetPassword.invalidToken")}
        form={null}
        footer={
          <p className="text-center text-sm text-muted-foreground">
            <Link
              href="/forgot-password"
              className="cursor-pointer font-medium text-foreground hover:text-primary"
            >
              {t("resetPassword.backToLogin")}
            </Link>
          </p>
        }
      />
    );
  }

  if (done) {
    return (
      <AuthShell
        title={t("resetPassword.successTitle")}
        subtitle={t("resetPassword.successMessage")}
        form={
          <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
            <CheckCircle className="size-4 shrink-0 text-green-500" />
            <span>{t("resetPassword.successMessage")}</span>
          </div>
        }
        footer={
          <p className="text-center text-sm text-muted-foreground">
            <Link
              href="/login"
              className="cursor-pointer font-medium text-foreground hover:text-primary"
            >
              {t("resetPassword.goToLogin")}
            </Link>
          </p>
        }
      />
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const result = resetPasswordSchema.safeParse({ password, confirmPassword });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setLoading(true);

    const { error: authError } = await authClient.resetPassword({
      newPassword: password,
      token: token!,
    });

    setLoading(false);

    if (authError) {
      setError(authError.message ?? t("resetPassword.errorFallback"));
      return;
    }

    setDone(true);
  }

  return (
    <AuthShell
      title={t("resetPassword.title")}
      subtitle={t("resetPassword.subtitle")}
      form={
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              {t("resetPassword.passwordLabel")}
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={t("resetPassword.passwordPlaceholder")}
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

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium">
              {t("resetPassword.confirmPasswordLabel")}
            </label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder={t("resetPassword.confirmPasswordPlaceholder")}
                className="h-11 rounded-xl bg-background/80 pr-11"
              />
              <button
                type="button"
                aria-label={t(
                  showConfirmPassword ? "password.hide" : "password.show",
                )}
                aria-pressed={showConfirmPassword}
                onClick={() => setShowConfirmPassword((current) => !current)}
                className="absolute top-1/2 right-3 inline-flex -translate-y-1/2 cursor-pointer items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none"
              >
                {showConfirmPassword ? (
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
              ? t("resetPassword.submitting")
              : t("resetPassword.submit")}
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
            {t("resetPassword.backToLogin")}
          </Link>
        </p>
      }
    />
  );
}
