-- CreateTable
CREATE TABLE "contact_interaction" (
    "id" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_interaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contact_interaction_contactId_idx" ON "contact_interaction"("contactId");

-- AddForeignKey
ALTER TABLE "contact_interaction" ADD CONSTRAINT "contact_interaction_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
