-- CreateTable
CREATE TABLE "french_vocabulary" (
    "id" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "translation" TEXT NOT NULL,
    "learned" BOOLEAN NOT NULL DEFAULT false,
    "difficult" BOOLEAN NOT NULL DEFAULT false,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "lastReviewAt" TIMESTAMP(3),
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "profileId" TEXT NOT NULL,

    CONSTRAINT "french_vocabulary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "french_vocabulary_profileId_idx" ON "french_vocabulary"("profileId");

-- CreateIndex
CREATE INDEX "french_vocabulary_profileId_learned_idx" ON "french_vocabulary"("profileId", "learned");

-- CreateIndex
CREATE INDEX "french_vocabulary_profileId_difficult_idx" ON "french_vocabulary"("profileId", "difficult");

-- AddForeignKey
ALTER TABLE "french_vocabulary" ADD CONSTRAINT "french_vocabulary_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "french_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
