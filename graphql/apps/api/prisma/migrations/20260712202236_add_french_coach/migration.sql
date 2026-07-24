-- CreateTable
CREATE TABLE "linkedin_optimizations" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "inputData" JSONB NOT NULL,
    "outputData" JSONB NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "linkedin_optimizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "french_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "frenchLevel" TEXT,
    "targetMarket" TEXT,
    "targetRole" TEXT,
    "targetIndustry" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "french_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "french_sessions" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "inputData" JSONB,
    "outputData" JSONB,
    "profileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "french_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "linkedin_optimizations_userId_type_idx" ON "linkedin_optimizations"("userId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "french_profiles_userId_key" ON "french_profiles"("userId");

-- CreateIndex
CREATE INDEX "french_sessions_profileId_idx" ON "french_sessions"("profileId");

-- CreateIndex
CREATE INDEX "french_sessions_profileId_type_idx" ON "french_sessions"("profileId", "type");

-- AddForeignKey
ALTER TABLE "linkedin_optimizations" ADD CONSTRAINT "linkedin_optimizations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "french_profiles" ADD CONSTRAINT "french_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "french_sessions" ADD CONSTRAINT "french_sessions_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "french_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
