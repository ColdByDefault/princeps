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

import { useTranslations } from "next-intl";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CustomToggle } from "@/components/shared";
import { useAssistantSettings } from "./logic/useAssistantSettings";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  AssistantTone,
  AddressStyle,
  ResponseLength,
} from "@/lib/settings/types";

type AssistantTabProps = {
  initialAssistantName: string | null;
  initialAssistantTone: AssistantTone | null;
  initialAddressStyle: AddressStyle | null;
  initialResponseLength: ResponseLength | null;
  initialCustomSystemPrompt: string | null;
  initialAutoBriefingEnabled: boolean;
  initialReportsEnabled: boolean;
  initialOverdueTaskNudgesEnabled: boolean;
  nudgesAvailable: boolean;
};

export function AssistantTab({
  initialAssistantName,
  initialAssistantTone,
  initialAddressStyle,
  initialResponseLength,
  initialCustomSystemPrompt,
  initialAutoBriefingEnabled,
  initialReportsEnabled,
  initialOverdueTaskNudgesEnabled,
  nudgesAvailable,
}: AssistantTabProps) {
  const t = useTranslations("settings.assistant");
  const {
    assistantName,
    assistantTone,
    addressStyle,
    responseLength,
    customPrompt,
    showPreview,
    autoBriefingEnabled,
    reportsEnabled,
    overdueTaskNudgesEnabled,
    handleNameChange,
    handleToneChange,
    handleAddressChange,
    handleLengthChange,
    handleCustomPromptChange,
    handleAutoBriefingToggle,
    handleReportsToggle,
    handleOverdueTaskNudgesToggle,
    handlePreviewToggle,
  } = useAssistantSettings({
    initialAssistantName,
    initialAssistantTone,
    initialAddressStyle,
    initialResponseLength,
    initialCustomSystemPrompt,
    initialAutoBriefingEnabled,
    initialReportsEnabled,
    initialOverdueTaskNudgesEnabled,
  });

  return (
    <div className="divide-y divide-border/60">
      {/* Section: Personality & Style */}
      <p className="pb-2 pt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {t("sectionPersonality")}
      </p>

      {/* Assistant Name */}
      <div className="flex items-center justify-between gap-4 py-4">
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="text-sm font-medium">{t("nameTitle")}</p>
          <p className="text-sm text-muted-foreground">
            {t("nameDescription")}
          </p>
        </div>
        <div className="w-44 shrink-0">
          <Input
            value={assistantName}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder={t("namePlaceholder")}
            maxLength={32}
            aria-label={t("nameTitle")}
          />
        </div>
      </div>

      {/* Personality & Tone */}
      <div className="flex items-center justify-between gap-4 py-4">
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="text-sm font-medium">{t("toneTitle")}</p>
          <p className="text-sm text-muted-foreground">
            {t("toneDescription")}
          </p>
        </div>
        <div className="w-44 shrink-0">
          <Select value={assistantTone} onValueChange={handleToneChange}>
            <SelectTrigger
              className="w-full cursor-pointer"
              aria-label={t("toneTitle")}
            >
              <SelectValue placeholder={t("toneSelectPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="professional" className="cursor-pointer">
                  {t("toneProfessional")}
                </SelectItem>
                <SelectItem value="friendly" className="cursor-pointer">
                  {t("toneFriendly")}
                </SelectItem>
                <SelectItem value="casual" className="cursor-pointer">
                  {t("toneCasual")}
                </SelectItem>
                <SelectItem value="witty" className="cursor-pointer">
                  {t("toneWitty")}
                </SelectItem>
                <SelectItem value="motivational" className="cursor-pointer">
                  {t("toneMotivational")}
                </SelectItem>
                <SelectItem value="concise" className="cursor-pointer">
                  {t("toneConcise")}
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Address Style */}
      <div className="flex items-center justify-between gap-4 py-4">
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="text-sm font-medium">{t("addressTitle")}</p>
          <p className="text-sm text-muted-foreground">
            {t("addressDescription")}
          </p>
        </div>
        <div className="w-44 shrink-0">
          <Select value={addressStyle} onValueChange={handleAddressChange}>
            <SelectTrigger
              className="w-full cursor-pointer"
              aria-label={t("addressTitle")}
            >
              <SelectValue placeholder={t("addressSelectPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="firstname" className="cursor-pointer">
                  {t("addressFirstname")}
                </SelectItem>
                <SelectItem value="formal_male" className="cursor-pointer">
                  {t("addressFormalMale")}
                </SelectItem>
                <SelectItem value="formal_female" className="cursor-pointer">
                  {t("addressFormalFemale")}
                </SelectItem>
                <SelectItem value="informal" className="cursor-pointer">
                  {t("addressInformal")}
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Response Length */}
      <div className="flex items-center justify-between gap-4 py-4">
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="text-sm font-medium">{t("lengthTitle")}</p>
          <p className="text-sm text-muted-foreground">
            {t("lengthDescription")}
          </p>
        </div>
        <div className="w-44 shrink-0">
          <Select value={responseLength} onValueChange={handleLengthChange}>
            <SelectTrigger
              className="w-full cursor-pointer"
              aria-label={t("lengthTitle")}
            >
              <SelectValue placeholder={t("lengthSelectPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="brief" className="cursor-pointer">
                  {t("lengthBrief")}
                </SelectItem>
                <SelectItem value="balanced" className="cursor-pointer">
                  {t("lengthBalanced")}
                </SelectItem>
                <SelectItem value="detailed" className="cursor-pointer">
                  {t("lengthDetailed")}
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Proactivity Level — Coming Soon */}
      <div className="flex items-center justify-between gap-4 py-4 opacity-60">
        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">{t("proactivityTitle")}</p>
            <Badge variant="secondary" className="text-xs">
              {t("comingSoon")}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {t("proactivityDescription")}
          </p>
        </div>
        <div className="flex w-44 shrink-0 items-center justify-end gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <div
              key={n}
              className="h-2 w-2 rounded-full bg-muted-foreground/30"
              aria-hidden="true"
            />
          ))}
        </div>
      </div>

      {/* Custom System Prompt */}
      <div className="flex flex-col gap-3 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-0.5">
            <p className="text-sm font-medium">{t("customPromptTitle")}</p>
            <p className="text-sm text-muted-foreground">
              {t("customPromptDescription")}
            </p>
          </div>
          <button
            type="button"
            onClick={handlePreviewToggle}
            className="cursor-pointer shrink-0 text-xs text-muted-foreground underline-offset-2 hover:underline"
            aria-label={
              showPreview
                ? t("customPromptHidePreview")
                : t("customPromptShowPreview")
            }
          >
            {showPreview
              ? t("customPromptHidePreview")
              : t("customPromptShowPreview")}
          </button>
        </div>

        {showPreview && customPrompt.trim() ? (
          <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t("customPromptPreviewLabel")}
            </p>
            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-code:before:content-none prose-code:after:content-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {customPrompt}
              </ReactMarkdown>
            </div>
          </div>
        ) : (
          <Textarea
            value={customPrompt}
            onChange={(e) => handleCustomPromptChange(e.target.value)}
            placeholder={t("customPromptPlaceholder")}
            maxLength={2000}
            rows={5}
            aria-label={t("customPromptTitle")}
            className="resize-none text-sm"
          />
        )}
        <p className="text-xs text-muted-foreground">
          {customPrompt.length}/2000
        </p>
      </div>

      {/* Section: Automation */}
      <p className="pb-2 pt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {t("sectionAutomation")}
      </p>

      {/* Automatic Daily Briefing */}
      <div className="flex items-center justify-between gap-4 py-4">
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="text-sm font-medium">{t("autoBriefingLabel")}</p>
          <p className="text-sm text-muted-foreground">
            {t("autoBriefingDescription")}
          </p>
        </div>
        <CustomToggle
          checked={autoBriefingEnabled}
          onCheckedChange={handleAutoBriefingToggle}
          aria-label={t("autoBriefingLabel")}
        />
      </div>

      {/* Overdue Task Nudges */}
      <div className="flex items-center justify-between gap-4 py-4">
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="text-sm font-medium">
            {t("overdueTaskNudgesLabel")}
          </p>
          <p className="text-sm text-muted-foreground">
            {t("overdueTaskNudgesDescription")}
          </p>
          {!nudgesAvailable && (
            <p className="text-xs text-muted-foreground/60">
              {t("overdueTaskNudgesUnavailable")}
            </p>
          )}
        </div>
        <CustomToggle
          checked={nudgesAvailable && overdueTaskNudgesEnabled}
          onCheckedChange={handleOverdueTaskNudgesToggle}
          disabled={!nudgesAvailable}
          aria-label={t("overdueTaskNudgesLabel")}
        />
      </div>

      {/* Activity Reports */}
      <div className="flex items-center justify-between gap-4 py-4">
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="text-sm font-medium">{t("reportsLabel")}</p>
          <p className="text-sm text-muted-foreground">
            {t("reportsDescription")}
          </p>
        </div>
        <CustomToggle
          checked={reportsEnabled}
          onCheckedChange={handleReportsToggle}
          aria-label={t("reportsLabel")}
        />
      </div>

      {/* Re-login notice */}
      <p className="pb-2 pt-4 text-xs text-muted-foreground">
        {t("reloginNotice")}
      </p>
    </div>
  );
}
