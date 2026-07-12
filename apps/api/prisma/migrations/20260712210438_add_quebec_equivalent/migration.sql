-- DropIndex
DROP INDEX "french_vocabulary_words_profileId_nextReviewAt_idx";

-- AlterTable
ALTER TABLE "french_vocabulary_words" ADD COLUMN     "quebecEquivalent" TEXT;

-- CreateIndex
CREATE INDEX "french_vocabulary_words_mastered_idx" ON "french_vocabulary_words"("mastered");

-- CreateIndex
CREATE INDEX "french_vocabulary_words_nextReviewAt_idx" ON "french_vocabulary_words"("nextReviewAt");
