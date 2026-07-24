-- CreateTable
CREATE TABLE "french_vocabulary_words" (
    "id" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "translation" TEXT NOT NULL,
    "context" TEXT,
    "note" TEXT,
    "difficulty" TEXT NOT NULL DEFAULT 'medium',
    "timesReviewed" INTEGER NOT NULL DEFAULT 0,
    "timesCorrect" INTEGER NOT NULL DEFAULT 0,
    "nextReviewAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mastered" BOOLEAN NOT NULL DEFAULT false,
    "profileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "french_vocabulary_words_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "french_vocabulary_words_profileId_idx" ON "french_vocabulary_words"("profileId");

-- CreateIndex
CREATE INDEX "french_vocabulary_words_profileId_nextReviewAt_idx" ON "french_vocabulary_words"("profileId", "nextReviewAt");

-- AddForeignKey
ALTER TABLE "french_vocabulary_words" ADD CONSTRAINT "french_vocabulary_words_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "french_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
