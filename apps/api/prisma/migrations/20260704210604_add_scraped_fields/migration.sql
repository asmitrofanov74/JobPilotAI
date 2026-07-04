-- AlterTable
ALTER TABLE "job_applications" ADD COLUMN     "scrapedAt" TIMESTAMP(3),
ADD COLUMN     "sourceId" TEXT,
ADD COLUMN     "sourceUrl" TEXT;
