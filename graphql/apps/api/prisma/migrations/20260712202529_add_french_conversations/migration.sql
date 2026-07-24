-- CreateTable
CREATE TABLE "french_conversations" (
    "id" TEXT NOT NULL,
    "scenario" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "french_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "french_messages" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "french_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "french_conversations_profileId_idx" ON "french_conversations"("profileId");

-- CreateIndex
CREATE INDEX "french_messages_conversationId_idx" ON "french_messages"("conversationId");

-- CreateIndex
CREATE INDEX "french_messages_conversationId_createdAt_idx" ON "french_messages"("conversationId", "createdAt");

-- AddForeignKey
ALTER TABLE "french_conversations" ADD CONSTRAINT "french_conversations_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "french_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "french_messages" ADD CONSTRAINT "french_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "french_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
