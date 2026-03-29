/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ChevronRight, ChevronLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getMessage } from "@/lib/i18n";
import type { MessageDictionary } from "@/types/i18n";

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "de", label: "Deutsch" },
];

const TOTAL_STEPS = 3;

interface Props {
  messages: MessageDictionary;
  defaultLanguage: string;
}

export function OnboardingWizard({ messages, defaultLanguage }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [language, setLanguage] = useState(defaultLanguage);
  const [assistantName, setAssistantName] = useState("");
  const [finishing, setFinishing] = useState(false);

  async function finish() {
    setFinishing(true);
    await fetch("/api/onboarding/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language,
        assistantName: assistantName.trim() || "Atlas",
      }),
    });
    router.push("/home");
    router.refresh();
  }

  return (
    <div className="flex min-h-svh items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl border border-border/70 bg-card/70">
            <Sparkles className="size-4 text-primary" />
          </div>
          <span className="text-sm text-muted-foreground">
            {getMessage(
              messages,
              "onboarding.step",
              "Step {current} of {total}",
            )
              .replace("{current}", String(step))
              .replace("{total}", String(TOTAL_STEPS))}
          </span>
        </div>

        {/* Step card */}
        <div className="rounded-2xl border border-border/70 bg-card/70 p-8 shadow-xl backdrop-blur">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-semibold">
                  {getMessage(
                    messages,
                    "onboarding.step1.title",
                    "Welcome to See-Sweet",
                  )}
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  {getMessage(
                    messages,
                    "onboarding.step1.body",
                    "Your private executive workspace.",
                  )}
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {getMessage(
                    messages,
                    "onboarding.step1.languageLabel",
                    "Display language",
                  )}
                </label>
                <div className="flex gap-2">
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.value}
                      onClick={() => setLanguage(l.value)}
                      className={`flex-1 cursor-pointer rounded-lg border px-4 py-2.5 text-sm transition-colors ${
                        language === l.value
                          ? "border-primary bg-primary/10 font-medium text-primary"
                          : "border-border hover:bg-muted/50"
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-semibold">
                  {getMessage(
                    messages,
                    "onboarding.step2.title",
                    "Name your assistant",
                  )}
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  {getMessage(
                    messages,
                    "onboarding.step2.body",
                    "You can change this any time in Settings.",
                  )}
                </p>
              </div>
              <Input
                value={assistantName}
                onChange={(e) => setAssistantName(e.target.value)}
                placeholder={getMessage(
                  messages,
                  "onboarding.step2.namePlaceholder",
                  "Atlas",
                )}
                maxLength={30}
                className="text-base"
              />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="flex size-12 items-center justify-center rounded-full bg-primary/15">
                <Check className="size-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold">
                  {getMessage(
                    messages,
                    "onboarding.step3.title",
                    "You're all set",
                  )}
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  {getMessage(
                    messages,
                    "onboarding.step3.body",
                    "Your workspace is ready.",
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 flex justify-between">
            <Button
              variant="ghost"
              size="sm"
              disabled={step === 1}
              onClick={() => setStep((s) => s - 1)}
              className="cursor-pointer gap-1.5"
            >
              <ChevronLeft className="size-4" />
              {getMessage(messages, "onboarding.back", "Back")}
            </Button>

            {step < TOTAL_STEPS ? (
              <Button
                size="sm"
                onClick={() => setStep((s) => s + 1)}
                className="cursor-pointer gap-1.5"
              >
                {getMessage(messages, "onboarding.next", "Next")}
                <ChevronRight className="size-4" />
              </Button>
            ) : (
              <Button
                size="sm"
                disabled={finishing}
                onClick={finish}
                className="cursor-pointer"
              >
                {finishing
                  ? getMessage(messages, "onboarding.finishing", "Setting up…")
                  : getMessage(
                      messages,
                      "onboarding.finish",
                      "Go to my workspace",
                    )}
              </Button>
            )}
          </div>
        </div>

        {/* Progress dots */}
        <div className="mt-6 flex justify-center gap-2">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i + 1 === step
                  ? "w-6 bg-primary"
                  : i + 1 < step
                    ? "w-3 bg-primary/50"
                    : "w-3 bg-border"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
