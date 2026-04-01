/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import { useState } from "react";
import { DecisionList } from "@/components/decisions";
import { getMessage } from "@/lib/i18n";
import type { DecisionRecord, LabelOptionRecord } from "@/types/api";
import type { MessageDictionary } from "@/types/i18n";

interface DecisionsViewProps {
  messages: MessageDictionary;
  initialDecisions: DecisionRecord[];
  availableLabels?: LabelOptionRecord[];
}

export function DecisionsView({
  messages,
  initialDecisions,
  availableLabels = [],
}: DecisionsViewProps) {
  const [decisions, setDecisions] =
    useState<DecisionRecord[]>(initialDecisions);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          {getMessage(messages, "decisions.metadata.title", "Decisions")}
        </h1>
        <p className="text-muted-foreground text-sm max-w-2xl">
          {getMessage(
            messages,
            "decisions.page.subtitle",
            "Keep a record of every significant choice — why you made it, what happened, and whether it still stands. The assistant reads your open decisions and recently closed ones so it can reason with you without repeating settled ground.",
          )}
        </p>
      </div>
      <DecisionList
        messages={messages}
        decisions={decisions}
        availableLabels={availableLabels}
        onDecisionsChange={setDecisions}
      />
    </div>
  );
}
