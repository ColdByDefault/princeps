/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getMessage } from "@/lib/i18n";
import {
  type KnowledgeDocumentListItem,
  type KnowledgeUsageSnapshot,
  type PersonalInfoRecord,
} from "@/types/knowledge";
import { type MessageDictionary } from "@/types/i18n";

type KnowledgePageViewProps = {
  initialDocuments: KnowledgeDocumentListItem[];
  initialError?: string | null;
  initialPersonalInfo: PersonalInfoRecord | null;
  initialUsage: KnowledgeUsageSnapshot;
  messages: MessageDictionary;
};

function formatBytes(value: number) {
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function serializeCustomFields(value: PersonalInfoRecord | null) {
  if (!value?.customFields?.length) {
    return "";
  }

  return value.customFields
    .map((field) => `${field.label}: ${field.value}`)
    .join("\n");
}

function parseCustomFields(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, ...rest] = line.split(":");

      return {
        label: label?.trim() ?? "",
        value: rest.join(":").trim(),
      };
    })
    .filter((field) => field.label && field.value);
}

function inferSourceType(file: File) {
  const lowerName = file.name.toLowerCase();

  if (lowerName.endsWith(".pdf")) return "pdf";
  if (lowerName.endsWith(".md") || lowerName.endsWith(".markdown")) {
    return "markdown";
  }

  return "text";
}

export default function KnowledgePageView({
  initialDocuments,
  initialError = null,
  initialPersonalInfo,
  initialUsage,
  messages,
}: KnowledgePageViewProps) {
  const [activeTab, setActiveTab] = useState<"documents" | "personal">(
    "documents",
  );
  const [documents, setDocuments] =
    useState<KnowledgeDocumentListItem[]>(initialDocuments);
  const [usage, setUsage] = useState<KnowledgeUsageSnapshot>(initialUsage);
  const [personalInfo, setPersonalInfo] = useState<PersonalInfoRecord | null>(
    initialPersonalInfo,
  );
  const [uploadTitle, setUploadTitle] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [tagsValue, setTagsValue] = useState("");
  const [priorityValue, setPriorityValue] = useState("medium");
  const [profileState, setProfileState] = useState({
    fullName: initialPersonalInfo?.fullName ?? "",
    occupation: initialPersonalInfo?.occupation ?? "",
    bio: initialPersonalInfo?.bio ?? "",
    customFields: serializeCustomFields(initialPersonalInfo),
  });
  const [error, setError] = useState<string | null>(initialError);
  const [success, setSuccess] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  async function refreshDocuments() {
    const response = await fetch("/api/knowledge");
    const payload = (await response.json()) as {
      documents?: KnowledgeDocumentListItem[];
      error?: string;
      usage?: KnowledgeUsageSnapshot;
    };

    if (!response.ok || !payload.documents || !payload.usage) {
      throw new Error(payload.error ?? "Failed to refresh knowledge data");
    }

    setDocuments(payload.documents);
    setUsage(payload.usage);
    setError(payload.error ?? null);
  }

  async function handleUpload() {
    if (!selectedFile) {
      setError(
        getMessage(
          messages,
          "knowledge.upload.fileRequired",
          "Select a file first.",
        ),
      );
      return;
    }

    setError(null);
    setSuccess(null);
    setIsBusy(true);

    try {
      const formData = new FormData();
      formData.set("file", selectedFile);
      formData.set(
        "title",
        uploadTitle.trim() || selectedFile.name.replace(/\.[^.]+$/, ""),
      );
      formData.set("sourceType", inferSourceType(selectedFile));
      formData.set("tags", tagsValue);
      formData.set("priority", priorityValue);

      const response = await fetch("/api/knowledge", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to upload knowledge document");
      }

      await refreshDocuments();
      setUploadTitle("");
      setSelectedFile(null);
      setTagsValue("");
      setPriorityValue("medium");
      setSuccess(
        getMessage(
          messages,
          "knowledge.upload.success",
          "Document uploaded successfully.",
        ),
      );
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Failed to upload knowledge document",
      );
    } finally {
      setIsBusy(false);
    }
  }

  async function handleDelete(documentId: string) {
    setError(null);
    setSuccess(null);
    setIsBusy(true);

    try {
      const response = await fetch(`/api/knowledge/${documentId}`, {
        method: "DELETE",
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to delete knowledge document");
      }

      await refreshDocuments();
      setSuccess(
        getMessage(
          messages,
          "knowledge.documents.deleted",
          "Document deleted.",
        ),
      );
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete knowledge document",
      );
    } finally {
      setIsBusy(false);
    }
  }

  async function handleReindex(documentId: string) {
    setError(null);
    setSuccess(null);
    setIsBusy(true);

    try {
      const response = await fetch(`/api/knowledge/${documentId}/reindex`, {
        method: "POST",
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(
          payload.error ?? "Failed to re-index knowledge document",
        );
      }

      await refreshDocuments();
      setSuccess(
        getMessage(
          messages,
          "knowledge.documents.reindexed",
          "Document re-indexed.",
        ),
      );
    } catch (reindexError) {
      setError(
        reindexError instanceof Error
          ? reindexError.message
          : "Failed to re-index knowledge document",
      );
    } finally {
      setIsBusy(false);
    }
  }

  async function handlePersonalInfoSave() {
    setError(null);
    setSuccess(null);
    setIsBusy(true);

    try {
      const response = await fetch("/api/knowledge/personal-info", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: profileState.fullName || null,
          occupation: profileState.occupation || null,
          bio: profileState.bio || null,
          customFields: parseCustomFields(profileState.customFields),
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        personalInfo?: PersonalInfoRecord;
      };

      if (!response.ok || !payload.personalInfo) {
        throw new Error(payload.error ?? "Failed to update personal info");
      }

      setPersonalInfo(payload.personalInfo);
      setSuccess(
        getMessage(
          messages,
          "knowledge.personal.saved",
          "Personal info saved.",
        ),
      );
    } catch (personalError) {
      setError(
        personalError instanceof Error
          ? personalError.message
          : "Failed to update personal info",
      );
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-7xl flex-col px-6 py-8 sm:px-8 lg:px-10">
      <section className="rounded-[2rem] border border-border/70 bg-card/70 p-6 shadow-xl shadow-black/5 backdrop-blur lg:p-8">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {getMessage(messages, "knowledge.page.title", "Knowledge base")}
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-8 text-muted-foreground sm:text-lg">
          {getMessage(
            messages,
            "knowledge.page.description",
            "Upload supported documents, manage assistant-facing personal info, and prepare retrieval context for chat.",
          )}
        </p>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          <div className="rounded-[1.5rem] border border-border/70 bg-background/70 p-5">
            <p className="text-xs font-semibold tracking-[0.22em] uppercase text-muted-foreground">
              {getMessage(messages, "knowledge.usage.tier", "Tier")}
            </p>
            <p className="mt-3 text-lg font-semibold">{usage.tier}</p>
          </div>
          <div className="rounded-[1.5rem] border border-border/70 bg-background/70 p-5">
            <p className="text-xs font-semibold tracking-[0.22em] uppercase text-muted-foreground">
              {getMessage(messages, "knowledge.usage.documents", "Documents")}
            </p>
            <p className="mt-3 text-lg font-semibold">
              {usage.activeDocuments} / {usage.maxDocuments}
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-border/70 bg-background/70 p-5">
            <p className="text-xs font-semibold tracking-[0.22em] uppercase text-muted-foreground">
              {getMessage(
                messages,
                "knowledge.usage.embedding",
                "Embedding usage",
              )}
            </p>
            <p className="mt-3 text-lg font-semibold">
              {usage.embeddingCharsUsed.toLocaleString()} /{" "}
              {usage.embeddingCharsLimit.toLocaleString()}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {getMessage(
                messages,
                "knowledge.usage.note",
                "Deleting documents does not refund embedding usage.",
              )}
            </p>
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-[2rem] border border-border/70 bg-card/70 p-6 shadow-xl shadow-black/5 backdrop-blur lg:p-8">
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant={activeTab === "documents" ? "default" : "outline"}
            className="cursor-pointer rounded-xl px-4"
            onClick={() => setActiveTab("documents")}
          >
            {getMessage(messages, "knowledge.tabs.documents", "Documents")}
          </Button>
          <Button
            type="button"
            variant={activeTab === "personal" ? "default" : "outline"}
            className="cursor-pointer rounded-xl px-4"
            onClick={() => setActiveTab("personal")}
          >
            {getMessage(messages, "knowledge.tabs.personal", "Personal info")}
          </Button>
        </div>

        {error ? (
          <div className="mt-6 rounded-[1.25rem] border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : null}
        {success ? (
          <div className="mt-6 rounded-[1.25rem] border border-border/70 bg-background/70 p-4 text-sm text-foreground">
            {success}
          </div>
        ) : null}

        {activeTab === "documents" ? (
          <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-4 rounded-[1.5rem] border border-border/70 bg-background/70 p-5">
              <h2 className="text-lg font-semibold">
                {getMessage(
                  messages,
                  "knowledge.upload.title",
                  "Upload a document",
                )}
              </h2>
              <Input
                value={uploadTitle}
                onChange={(event) => setUploadTitle(event.target.value)}
                placeholder={getMessage(
                  messages,
                  "knowledge.upload.titlePlaceholder",
                  "Document title",
                )}
              />
              <Input
                type="file"
                accept=".txt,.md,.markdown,.pdf,text/plain,text/markdown,application/pdf"
                onChange={(event) =>
                  setSelectedFile(event.target.files?.[0] ?? null)
                }
                className="cursor-pointer"
              />
              <Input
                value={tagsValue}
                onChange={(event) => setTagsValue(event.target.value)}
                placeholder={getMessage(
                  messages,
                  "knowledge.upload.tagsPlaceholder",
                  "Tags, comma separated",
                )}
              />
              <Input
                value={priorityValue}
                onChange={(event) => setPriorityValue(event.target.value)}
                placeholder={getMessage(
                  messages,
                  "knowledge.upload.priorityPlaceholder",
                  "Priority: low, medium, or high",
                )}
              />
              <p className="text-xs text-muted-foreground">
                {getMessage(
                  messages,
                  "knowledge.upload.helper",
                  `Supported files: txt, md, pdf. Max upload size for your plan: ${formatBytes(usage.maxUploadBytes)}.`,
                )}
              </p>
              <Button
                type="button"
                className="cursor-pointer rounded-xl px-4"
                disabled={isBusy}
                onClick={handleUpload}
              >
                {getMessage(
                  messages,
                  "knowledge.upload.submit",
                  "Upload document",
                )}
              </Button>
            </div>

            <div className="space-y-4">
              {documents.length === 0 ? (
                <div className="rounded-[1.5rem] border border-dashed border-border/70 bg-background/60 p-6 text-sm text-muted-foreground">
                  {getMessage(
                    messages,
                    "knowledge.documents.empty",
                    "No documents indexed yet.",
                  )}
                </div>
              ) : (
                documents.map((document) => (
                  <article
                    key={document.id}
                    className="rounded-[1.5rem] border border-border/70 bg-background/70 p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold">
                          {document.title}
                        </h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                          {document.fileName ?? document.sourceType} ·{" "}
                          {document.status}
                        </p>
                        <p className="mt-2 text-sm text-muted-foreground">
                          {document.chunkCount} chunks ·{" "}
                          {document.embeddingChars.toLocaleString()} chars
                        </p>
                        {document.lastError ? (
                          <p className="mt-2 text-sm text-destructive">
                            {document.lastError}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="cursor-pointer rounded-xl px-4"
                          disabled={isBusy}
                          onClick={() => handleReindex(document.id)}
                        >
                          {getMessage(
                            messages,
                            "knowledge.documents.reindex",
                            "Re-index",
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="cursor-pointer rounded-xl px-4"
                          disabled={isBusy}
                          onClick={() => handleDelete(document.id)}
                        >
                          {getMessage(
                            messages,
                            "knowledge.documents.delete",
                            "Delete",
                          )}
                        </Button>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-[1.5rem] border border-border/70 bg-background/70 p-5">
            <div className="grid gap-4 lg:grid-cols-2">
              <Input
                value={profileState.fullName}
                onChange={(event) =>
                  setProfileState((current) => ({
                    ...current,
                    fullName: event.target.value,
                  }))
                }
                placeholder={getMessage(
                  messages,
                  "knowledge.personal.fullName",
                  "Full name",
                )}
              />
              <Input
                value={profileState.occupation}
                onChange={(event) =>
                  setProfileState((current) => ({
                    ...current,
                    occupation: event.target.value,
                  }))
                }
                placeholder={getMessage(
                  messages,
                  "knowledge.personal.occupation",
                  "Occupation",
                )}
              />
            </div>
            <Textarea
              value={profileState.bio}
              onChange={(event) =>
                setProfileState((current) => ({
                  ...current,
                  bio: event.target.value,
                }))
              }
              placeholder={getMessage(
                messages,
                "knowledge.personal.bio",
                "Bio",
              )}
              className="mt-4"
            />
            <Textarea
              value={profileState.customFields}
              onChange={(event) =>
                setProfileState((current) => ({
                  ...current,
                  customFields: event.target.value,
                }))
              }
              placeholder={getMessage(
                messages,
                "knowledge.personal.customFields",
                "Custom fields, one per line. Example: Board role: Chair",
              )}
              className="mt-4"
            />
            <p className="mt-3 text-xs text-muted-foreground">
              {getMessage(
                messages,
                "knowledge.personal.helper",
                "These fields are used as assistant context. Custom fields should use the format Label: Value.",
              )}
            </p>
            <Button
              type="button"
              className="mt-4 cursor-pointer rounded-xl px-4"
              disabled={isBusy}
              onClick={handlePersonalInfoSave}
            >
              {getMessage(
                messages,
                "knowledge.personal.save",
                "Save personal info",
              )}
            </Button>
            {personalInfo ? (
              <p className="mt-4 text-xs text-muted-foreground">
                {getMessage(
                  messages,
                  "knowledge.personal.updated",
                  "Last updated",
                )}
                : {new Date(personalInfo.updatedAt).toLocaleString()}
              </p>
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}
