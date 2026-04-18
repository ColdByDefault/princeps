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
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { AuthShell } from "@/components/auth/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth/auth-client";
import { signUpSchema } from "@/lib/auth/auth-schemas";

export default function SignUpCard() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const result = signUpSchema.safeParse({
      name,
      username,
      email,
      password,
      confirmPassword,
    });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setLoading(true);

    const { error: authError } = await authClient.signUp.email({
      name,
      username,
      email,
      password,
      callbackURL: "/home",
    });

    if (authError) {
      setError(authError.message ?? t("signUp.errorFallback"));
      setLoading(false);
      return;
    }

    router.push("/onboarding/plan");
    router.refresh();
  }

  return (
    <AuthShell
      title={t("signUp.title")}
      subtitle={t("signUp.subtitle")}
      form={
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              {t("signUp.nameLabel")}
            </label>
            <Input
              id="name"
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t("signUp.namePlaceholder")}
              className="h-11 rounded-xl bg-background/80"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="username" className="text-sm font-medium">
              {t("signUp.usernameLabel")}
            </label>
            <Input
              id="username"
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder={t("signUp.usernamePlaceholder")}
              className="h-11 rounded-xl bg-background/80"
            />
            <p className="text-xs text-muted-foreground">
              {t("signUp.usernameHint")}
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              {t("signUp.emailLabel")}
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={t("signUp.emailPlaceholder")}
              className="h-11 rounded-xl bg-background/80"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              {t("signUp.passwordLabel")}
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
                placeholder={t("signUp.passwordPlaceholder")}
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
              {t("signUp.confirmPasswordLabel")}
            </label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder={t("signUp.confirmPasswordPlaceholder")}
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
            {loading ? t("signUp.submitting") : t("signUp.submit")}
            <ArrowRight className="size-4" />
          </Button>
          <p className="text-center text-xs text-muted-foreground/70">
            {t("signUp.freeHint")}
          </p>
        </form>
      }
      footer={
        <p className="text-center text-sm text-muted-foreground">
          {t("signUp.switchPrompt")}{" "}
          <Link
            href="/login"
            className="cursor-pointer font-medium text-foreground hover:text-primary"
          >
            {t("signUp.switchLink")}
          </Link>
        </p>
      }
    />
  );
}
