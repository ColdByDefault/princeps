/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import { useState } from "react";
import { MeetingList } from "@/components/meetings";
import { getMessage } from "@/lib/i18n";
import type {
  ContactRecord,
  LabelOptionRecord,
  MeetingRecord,
} from "@/types/api";
import type { MessageDictionary } from "@/types/i18n";

interface MeetingsViewProps {
  messages: MessageDictionary;
  initialMeetings: MeetingRecord[];
  contacts: ContactRecord[];
  availableLabels?: LabelOptionRecord[];
}

export function MeetingsView({
  messages,
  initialMeetings,
  contacts,
  availableLabels = [],
}: MeetingsViewProps) {
  const [meetings, setMeetings] = useState<MeetingRecord[]>(initialMeetings);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        {getMessage(messages, "meetings.metadata.title", "Meetings")}
      </h1>
      <MeetingList
        messages={messages}
        meetings={meetings}
        contacts={contacts}
        availableLabels={availableLabels}
        onMeetingsChange={setMeetings}
      />
    </div>
  );
}
