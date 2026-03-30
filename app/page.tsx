/**
 * @author ColdByDefault
 * @copyright  2026 ColdByDefault. All Rights Reserved.
 */

import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  CalendarCheck2,
  Check,
  FileSearch,
  Network,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { getRequestConfig } from "@/i18n/request";
import { auth } from "@/lib/auth";
import { getMessage } from "@/lib/i18n";
import { defineSEO, getSeoLocale } from "@/lib/seo";
import { Button } from "@/components/ui/button";

export async function generateMetadata() {
  const { language, messages } = await getRequestConfig();

  return defineSEO({
    title: getMessage(messages, "landing.metadata.title", "See-Sweet"),
    description: getMessage(
      messages,
      "landing.metadata.description",
      "Private executive secretariat for focused operators.",
    ),
    path: "/",
    locale: getSeoLocale(language),
  });
}

export default async function LandingPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    redirect("/home");
  }

  const { messages } = await getRequestConfig();

  const useCases = [
    {
      body: getMessage(messages, "landing.useCase.founder.body", ""),
      title: getMessage(messages, "landing.useCase.founder.title", ""),
    },
    {
      body: getMessage(messages, "landing.useCase.executive.body", ""),
      title: getMessage(messages, "landing.useCase.executive.title", ""),
    },
    {
      body: getMessage(messages, "landing.useCase.operator.body", ""),
      title: getMessage(messages, "landing.useCase.operator.title", ""),
    },
  ];

  const capabilities = [
    getMessage(messages, "landing.capability.memory", ""),
    getMessage(messages, "landing.capability.briefing", ""),
    getMessage(messages, "landing.capability.meetings", ""),
    getMessage(messages, "landing.capability.tasks", ""),
    getMessage(messages, "landing.capability.contacts", ""),
    getMessage(messages, "landing.capability.decisions", ""),
  ];

  const tiers = [
    {
      name: getMessage(messages, "landing.pricing.free.name", "Free"),
      price: getMessage(messages, "landing.pricing.free.price", "$0"),
      period: getMessage(messages, "landing.pricing.free.period", "forever"),
      description: getMessage(messages, "landing.pricing.free.description", ""),
      features: [
        getMessage(messages, "landing.pricing.free.feature1", ""),
        getMessage(messages, "landing.pricing.free.feature2", ""),
        getMessage(messages, "landing.pricing.free.feature3", ""),
        getMessage(messages, "landing.pricing.free.feature4", ""),
        getMessage(messages, "landing.pricing.free.feature5", ""),
      ],
      cta: getMessage(messages, "landing.pricing.cta.free", "Get started free"),
      ctaHref: "/sign-up",
      highlighted: false,
    },
    {
      name: getMessage(messages, "landing.pricing.pro.name", "Pro"),
      price: getMessage(messages, "landing.pricing.pro.price", "Coming soon"),
      period: getMessage(messages, "landing.pricing.pro.period", "per month"),
      description: getMessage(messages, "landing.pricing.pro.description", ""),
      features: [
        getMessage(messages, "landing.pricing.pro.feature1", ""),
        getMessage(messages, "landing.pricing.pro.feature2", ""),
        getMessage(messages, "landing.pricing.pro.feature3", ""),
        getMessage(messages, "landing.pricing.pro.feature4", ""),
        getMessage(messages, "landing.pricing.pro.feature5", ""),
      ],
      cta: getMessage(messages, "landing.pricing.cta.paid", "Coming soon"),
      ctaHref: null,
      highlighted: true,
      badge: getMessage(
        messages,
        "landing.pricing.badge.popular",
        "Most popular",
      ),
    },
    {
      name: getMessage(messages, "landing.pricing.premium.name", "Premium"),
      price: getMessage(
        messages,
        "landing.pricing.premium.price",
        "Coming soon",
      ),
      period: getMessage(
        messages,
        "landing.pricing.premium.period",
        "per month",
      ),
      description: getMessage(
        messages,
        "landing.pricing.premium.description",
        "",
      ),
      features: [
        getMessage(messages, "landing.pricing.premium.feature1", ""),
        getMessage(messages, "landing.pricing.premium.feature2", ""),
        getMessage(messages, "landing.pricing.premium.feature3", ""),
        getMessage(messages, "landing.pricing.premium.feature4", ""),
        getMessage(messages, "landing.pricing.premium.feature5", ""),
      ],
      cta: getMessage(messages, "landing.pricing.cta.paid", "Coming soon"),
      ctaHref: null,
      highlighted: false,
    },
  ];

  return (
    <div className="mx-auto flex min-h-full w-full max-w-7xl flex-col px-6 py-8 sm:px-8 lg:px-10">
      <header className="flex items-center justify-between gap-4 py-4">
        <div>
          <p className="text-sm font-semibold tracking-[0.24em] text-primary uppercase">
            {getMessage(messages, "auth.brandName", "See-Sweet")}
          </p>
          <p className="text-sm text-muted-foreground">
            {getMessage(messages, "landing.headerLabel", "")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            size="lg"
            variant="ghost"
            nativeButton={false}
            render={<Link href="/login" />}
          >
            {getMessage(messages, "landing.secondaryCta", "")}
          </Button>
          <Button
            size="lg"
            nativeButton={false}
            render={<Link href="/sign-up" />}
          >
            {getMessage(messages, "landing.primaryCta", "")}
          </Button>
        </div>
      </header>

      <section className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[1.15fr_0.85fr] lg:py-16">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-4 py-2 text-sm text-muted-foreground backdrop-blur">
            <Sparkles className="size-4 text-primary" />
            {getMessage(messages, "landing.badge", "")}
          </div>

          <div className="space-y-5">
            <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              {getMessage(messages, "landing.title", "")}
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
              {getMessage(messages, "landing.subtitle", "")}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              size="lg"
              className="rounded-xl px-5"
              nativeButton={false}
              render={<Link href="/sign-up" />}
            >
              {getMessage(messages, "landing.primaryCta", "")}
              <ArrowRight className="size-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="rounded-xl px-5"
              nativeButton={false}
              render={<Link href="/login" />}
            >
              {getMessage(messages, "landing.secondaryCta", "")}
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-border/70 bg-background/75 p-4 backdrop-blur">
              <ShieldCheck className="mb-3 size-5 text-primary" />
              <p className="text-sm font-medium text-foreground">
                {getMessage(messages, "landing.signal.private.title", "")}
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {getMessage(messages, "landing.signal.private.body", "")}
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/75 p-4 backdrop-blur">
              <CalendarCheck2 className="mb-3 size-5 text-primary" />
              <p className="text-sm font-medium text-foreground">
                {getMessage(messages, "landing.signal.prep.title", "")}
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {getMessage(messages, "landing.signal.prep.body", "")}
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/75 p-4 backdrop-blur">
              <Network className="mb-3 size-5 text-primary" />
              <p className="text-sm font-medium text-foreground">
                {getMessage(messages, "landing.signal.followThrough.title", "")}
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {getMessage(messages, "landing.signal.followThrough.body", "")}
              </p>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-4 rounded-[2rem] bg-linear-to-br from-primary/18 via-transparent to-primary/6 blur-3xl" />
          <div className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-background/80 p-6 shadow-2xl shadow-primary/5 backdrop-blur lg:p-8">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {getMessage(messages, "landing.panel.title", "")}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {getMessage(messages, "landing.panel.subtitle", "")}
                </p>
              </div>
              <div className="rounded-full border border-primary/20 bg-primary/10 p-2 text-primary">
                <FileSearch className="size-4" />
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <p className="text-xs font-semibold tracking-[0.22em] text-muted-foreground uppercase">
                  {getMessage(messages, "landing.useCasesTitle", "")}
                </p>
                <div className="mt-3 space-y-3">
                  {useCases.map((useCase) => (
                    <div
                      key={useCase.title}
                      className="rounded-2xl border border-border/60 bg-muted/35 p-4"
                    >
                      <p className="text-sm font-medium text-foreground">
                        {useCase.title}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {useCase.body}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold tracking-[0.22em] text-muted-foreground uppercase">
                  {getMessage(messages, "landing.capabilitiesTitle", "")}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {capabilities.map((capability) => (
                    <span
                      key={capability}
                      className="rounded-full border border-border/70 bg-background px-3 py-2 text-sm text-foreground"
                    >
                      {capability}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing section */}
      <section className="py-16">
        <div className="text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground">
            {getMessage(messages, "landing.pricing.sectionTitle", "Pricing")}
          </h2>
          <p className="mt-3 text-base text-muted-foreground">
            {getMessage(messages, "landing.pricing.sectionSubtitle", "")}
          </p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative flex flex-col rounded-2xl border p-6 ${
                tier.highlighted
                  ? "border-primary/50 bg-primary/5 shadow-lg shadow-primary/10"
                  : "border-border/70 bg-background/75"
              } backdrop-blur`}
            >
              {tier.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border border-primary/30 bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">
                  {tier.badge}
                </span>
              )}

              <div>
                <p className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                  {tier.name}
                </p>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-foreground">
                    {tier.price}
                  </span>
                  {tier.ctaHref && (
                    <span className="text-sm text-muted-foreground">
                      / {tier.period}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {tier.description}
                </p>
              </div>

              <ul className="mt-6 flex-1 space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span className="text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                {tier.ctaHref ? (
                  <Button
                    className="w-full rounded-xl"
                    nativeButton={false}
                    render={<Link href={tier.ctaHref} />}
                  >
                    {tier.cta}
                  </Button>
                ) : (
                  <Button
                    className="w-full rounded-xl"
                    variant="outline"
                    disabled
                  >
                    {tier.cta}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
