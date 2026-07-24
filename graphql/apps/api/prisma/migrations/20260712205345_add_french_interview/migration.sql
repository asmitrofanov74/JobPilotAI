-- CreateTable
CREATE TABLE "french_interviews" (
    "id" TEXT NOT NULL,
    "scenario" TEXT NOT NULL,
    "questionCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "questions" JSONB NOT NULL DEFAULT '[]',
    "answers" JSONB NOT NULL DEFAULT '[]',
    "evaluations" JSONB NOT NULL DEFAULT '[]',
    "overallScore" INTEGER,
    "profileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "french_interviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "french_interviews_profileId_idx" ON "french_interviews"("profileId");

-- AddForeignKey
ALTER TABLE "french_interviews" ADD CONSTRAINT "french_interviews_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "french_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
