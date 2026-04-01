ALTER TABLE "label"
ADD COLUMN IF NOT EXISTS "color" TEXT NOT NULL DEFAULT '#6366f1';

CREATE TABLE IF NOT EXISTS "label_on_contact" (
    "labelId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,

    CONSTRAINT "label_on_contact_pkey" PRIMARY KEY ("labelId", "contactId"),
    CONSTRAINT "label_on_contact_labelId_fkey" FOREIGN KEY ("labelId") REFERENCES "label"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "label_on_contact_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contact"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "label_on_meeting" (
    "labelId" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,

    CONSTRAINT "label_on_meeting_pkey" PRIMARY KEY ("labelId", "meetingId"),
    CONSTRAINT "label_on_meeting_labelId_fkey" FOREIGN KEY ("labelId") REFERENCES "label"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "label_on_meeting_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "label_on_task" (
    "labelId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,

    CONSTRAINT "label_on_task_pkey" PRIMARY KEY ("labelId", "taskId"),
    CONSTRAINT "label_on_task_labelId_fkey" FOREIGN KEY ("labelId") REFERENCES "label"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "label_on_task_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "task"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "label_on_decision" (
    "labelId" TEXT NOT NULL,
    "decisionId" TEXT NOT NULL,

    CONSTRAINT "label_on_decision_pkey" PRIMARY KEY ("labelId", "decisionId"),
    CONSTRAINT "label_on_decision_labelId_fkey" FOREIGN KEY ("labelId") REFERENCES "label"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "label_on_decision_decisionId_fkey" FOREIGN KEY ("decisionId") REFERENCES "decision"("id") ON DELETE CASCADE ON UPDATE CASCADE
);