-- CreateTable
CREATE TABLE "questions" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answerJson" JSONB NOT NULL,
    "marks" INTEGER NOT NULL,
    "difficulty" TEXT NOT NULL,
    "bloomLevel" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "questions_documentId_idx" ON "questions"("documentId");

-- CreateIndex
CREATE INDEX "questions_deletedAt_idx" ON "questions"("deletedAt");

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
