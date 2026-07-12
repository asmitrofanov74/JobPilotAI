-- CreateTable
CREATE TABLE "french_evaluations" (
    "id" TEXT NOT NULL,
    "grammarScore" INTEGER NOT NULL,
    "vocabularyScore" INTEGER NOT NULL,
    "fluencyScore" INTEGER NOT NULL,
    "corrections" JSONB NOT NULL,
    "improvedVersion" TEXT NOT NULL,
    "quebecAlternative" TEXT,
    "messageId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "french_evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "french_evaluations_messageId_key" ON "french_evaluations"("messageId");

-- AddForeignKey
ALTER TABLE "french_evaluations" ADD CONSTRAINT "french_evaluations_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "french_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
