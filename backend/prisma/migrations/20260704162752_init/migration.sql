-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('SAVED', 'APPLIED', 'PHONE_SCREEN', 'TECHNICAL', 'ONSITE', 'OFFER', 'ACCEPTED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "InterviewType" AS ENUM ('PHONE', 'TECHNICAL', 'BEHAVIORAL', 'SYSTEM_DESIGN', 'CODING', 'ONSITE', 'PANEL', 'TAKE_HOME');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('TECHNICAL', 'BEHAVIORAL', 'SYSTEM_DESIGN', 'CODING');

-- CreateEnum
CREATE TYPE "SubscriptionTier" AS ENUM ('FREE', 'PRO');

-- CreateEnum
CREATE TYPE "ApplicationSource" AS ENUM ('MANUAL', 'LINKEDIN', 'INDEED', 'GLASSDOOR', 'COMPANY_SITE', 'REFERRAL', 'OTHER');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "title" TEXT,
    "targetRole" TEXT,
    "experienceLevel" TEXT,
    "targetLocations" TEXT,
    "summary" TEXT,
    "avatarUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "tier" "SubscriptionTier" NOT NULL DEFAULT 'FREE',
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_applications" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "companyWebsite" TEXT,
    "companyLogo" TEXT,
    "jobTitle" TEXT NOT NULL,
    "jobUrl" TEXT,
    "jobDescription" TEXT,
    "location" TEXT,
    "salaryRange" TEXT,
    "salaryMin" INTEGER,
    "salaryMax" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'CAD',
    "employmentType" TEXT,
    "workMode" TEXT,
    "status" "JobStatus" NOT NULL DEFAULT 'SAVED',
    "source" "ApplicationSource" NOT NULL DEFAULT 'MANUAL',
    "notes" TEXT,
    "appliedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "offerSalary" INTEGER,
    "offerEquity" TEXT,
    "offerBenefits" TEXT,
    "offerDeadline" TIMESTAMP(3),
    "offerAcceptedAt" TIMESTAMP(3),
    "rating" INTEGER,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interviews" (
    "id" TEXT NOT NULL,
    "type" "InterviewType" NOT NULL,
    "round" INTEGER NOT NULL DEFAULT 1,
    "scheduledAt" TIMESTAMP(3),
    "durationMinutes" INTEGER,
    "interviewers" TEXT,
    "location" TEXT,
    "notes" TEXT,
    "feedback" TEXT,
    "rating" INTEGER,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "jobApplicationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_events" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "jobApplicationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resumes" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileKey" TEXT NOT NULL,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "parsedSkills" TEXT,
    "parsedExperience" TEXT,
    "parsedEducation" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resumes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cover_letters" (
    "id" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tone" TEXT NOT NULL DEFAULT 'professional',
    "jobDescription" TEXT,
    "isGenerated" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cover_letters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interview_questions" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT,
    "type" "QuestionType" NOT NULL,
    "category" TEXT,
    "difficulty" INTEGER,
    "source" TEXT,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interview_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_gap_reports" (
    "id" TEXT NOT NULL,
    "jobDescription" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "requiredSkills" JSONB NOT NULL,
    "userSkills" JSONB NOT NULL,
    "missingSkills" JSONB NOT NULL,
    "matchScore" DOUBLE PRECISION NOT NULL,
    "recommendations" JSONB,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skill_gap_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "market_skills" (
    "id" TEXT NOT NULL,
    "skill" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "month" TEXT NOT NULL,
    "role" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "market_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salary_data" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "location" TEXT,
    "experienceLevel" TEXT,
    "salaryMin" INTEGER NOT NULL,
    "salaryMax" INTEGER NOT NULL,
    "salaryAvg" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'CAD',
    "source" TEXT NOT NULL DEFAULT 'job_posting',
    "month" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "salary_data_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_userId_key" ON "subscriptions"("userId");

-- CreateIndex
CREATE INDEX "job_applications_userId_status_idx" ON "job_applications"("userId", "status");

-- CreateIndex
CREATE INDEX "job_applications_userId_companyName_idx" ON "job_applications"("userId", "companyName");

-- CreateIndex
CREATE INDEX "job_applications_userId_createdAt_idx" ON "job_applications"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "interviews_jobApplicationId_idx" ON "interviews"("jobApplicationId");

-- CreateIndex
CREATE INDEX "application_events_jobApplicationId_idx" ON "application_events"("jobApplicationId");

-- CreateIndex
CREATE INDEX "application_events_createdAt_idx" ON "application_events"("createdAt");

-- CreateIndex
CREATE INDEX "resumes_userId_idx" ON "resumes"("userId");

-- CreateIndex
CREATE INDEX "cover_letters_userId_idx" ON "cover_letters"("userId");

-- CreateIndex
CREATE INDEX "interview_questions_userId_type_idx" ON "interview_questions"("userId", "type");

-- CreateIndex
CREATE INDEX "skill_gap_reports_userId_idx" ON "skill_gap_reports"("userId");

-- CreateIndex
CREATE INDEX "market_skills_month_idx" ON "market_skills"("month");

-- CreateIndex
CREATE INDEX "market_skills_skill_idx" ON "market_skills"("skill");

-- CreateIndex
CREATE UNIQUE INDEX "market_skills_skill_month_role_key" ON "market_skills"("skill", "month", "role");

-- CreateIndex
CREATE INDEX "salary_data_role_location_idx" ON "salary_data"("role", "location");

-- CreateIndex
CREATE INDEX "salary_data_month_idx" ON "salary_data"("month");

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_jobApplicationId_fkey" FOREIGN KEY ("jobApplicationId") REFERENCES "job_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_events" ADD CONSTRAINT "application_events_jobApplicationId_fkey" FOREIGN KEY ("jobApplicationId") REFERENCES "job_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resumes" ADD CONSTRAINT "resumes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cover_letters" ADD CONSTRAINT "cover_letters_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_questions" ADD CONSTRAINT "interview_questions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_gap_reports" ADD CONSTRAINT "skill_gap_reports_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
