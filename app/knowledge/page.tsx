/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { KnowledgePageView } from "@/components/knowledge";
import { getRequestConfig } from "@/i18n/request";
import { auth } from "@/lib/auth";
import { listKnowledgeDocuments } from "@/lib/knowledge/list.logic";
import { getKnowledgePersonalInfo } from "@/lib/knowledge/personal-info.logic";
import {
  isKnowledgeDocumentPriority,
  isKnowledgeSourceType,
  type KnowledgeDocumentListItem,
  type PersonalInfoRecord,
} from "@/types/knowledge";

function toKnowledgeDocuments(
  value: Awaited<ReturnType<typeof listKnowledgeDocuments>>["documents"],
): KnowledgeDocumentListItem[] {
  return value.map((document) => ({
    ...document,
    sourceType: isKnowledgeSourceType(document.sourceType)
      ? document.sourceType
      : "text",
    priority: isKnowledgeDocumentPriority(document.priority)
      ? document.priority
      : "medium",
    status:
      document.status === "processing" ||
      document.status === "ready" ||
      document.status === "failed"
        ? document.status
        : "failed",
  }));
}

function toPersonalInfoRecord(
  value: Awaited<ReturnType<typeof getKnowledgePersonalInfo>>,
): PersonalInfoRecord | null {
  if (!value) {
    return null;
  }

  const customFields = Array.isArray(value.customFields)
    ? value.customFields
        .map((field) => {
          if (
            !field ||
            typeof field !== "object" ||
            !("label" in field) ||
            !("value" in field) ||
            typeof field.label !== "string" ||
            typeof field.value !== "string"
          ) {
            return null;
          }

          return {
            label: field.label,
            value: field.value,
          };
        })
        .filter((field): field is { label: string; value: string } =>
          Boolean(field),
        )
    : [];

  return {
    ...value,
    customFields,
  };
}

export default async function KnowledgePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const { messages } = await getRequestConfig();
  const [{ documents, usage, error }, personalInfo] = await Promise.all([
    listKnowledgeDocuments(session.user.id, {}),
    getKnowledgePersonalInfo(session.user.id),
  ]);

  return (
    <KnowledgePageView
      initialDocuments={toKnowledgeDocuments(documents)}
      initialError={error}
      initialPersonalInfo={toPersonalInfoRecord(personalInfo)}
      initialUsage={usage}
      messages={messages}
    />
  );
}
