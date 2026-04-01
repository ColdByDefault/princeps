CREATE TABLE IF NOT EXISTS "label_on_knowledge_document" (
    "labelId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,

    CONSTRAINT "label_on_knowledge_document_pkey" PRIMARY KEY ("labelId", "documentId"),
    CONSTRAINT "label_on_knowledge_document_labelId_fkey" FOREIGN KEY ("labelId") REFERENCES "label"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "label_on_knowledge_document_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "knowledge_document"("id") ON DELETE CASCADE ON UPDATE CASCADE
);