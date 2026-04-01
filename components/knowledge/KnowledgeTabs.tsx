/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getMessage } from "@/lib/i18n";
import { DocumentList } from "./DocumentList";
import { PersonalInfoForm } from "./PersonalInfoForm";
import type {
  KnowledgeDocumentRecord,
  LabelOptionRecord,
  PersonalInfoFields,
} from "@/types/api";
import type { MessageDictionary } from "@/types/i18n";

interface KnowledgeTabsProps {
  messages: MessageDictionary;
  initialDocuments: KnowledgeDocumentRecord[];
  initialPersonalInfo: PersonalInfoFields;
  docLimit: number;
  availableLabels?: LabelOptionRecord[];
}

export function KnowledgeTabs({
  messages,
  initialDocuments,
  initialPersonalInfo,
  docLimit,
  availableLabels = [],
}: KnowledgeTabsProps) {
  const [documents, setDocuments] =
    useState<KnowledgeDocumentRecord[]>(initialDocuments);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        {getMessage(messages, "knowledge.metadata.title", "Knowledge Base")}
      </h1>

      <Tabs defaultValue="documents">
        <TabsList className="mb-6">
          <TabsTrigger value="documents">
            {getMessage(messages, "knowledge.tab.documents", "Knowledge Base")}
          </TabsTrigger>
          <TabsTrigger value="personal-info">
            {getMessage(
              messages,
              "knowledge.tab.personalInfo",
              "Personal Info",
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="documents">
          <DocumentList
            messages={messages}
            documents={documents}
            onDocumentsChange={setDocuments}
            docLimit={docLimit}
            availableLabels={availableLabels}
          />
        </TabsContent>

        <TabsContent value="personal-info">
          <PersonalInfoForm
            messages={messages}
            initialFields={initialPersonalInfo}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
