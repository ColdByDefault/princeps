/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
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
import { authClient } from "@/lib/auth-client";

export default function SignUpCard() {
  const t = useTranslations("auth");
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
      setError(authError.message ?? t("signUp.errorFallback"));
      setLoading(false);
      return;
    }

    router.push("/home");
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

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <Button
            type="submit"
            disabled={loading}
            className="h-11 w-full cursor-pointer rounded-xl"
          >
            {loading ? t("signUp.submitting") : t("signUp.submit")}
            <ArrowRight className="size-4" />
          </Button>
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
