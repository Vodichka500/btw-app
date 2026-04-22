-- CreateEnum
CREATE TYPE "NotificationTiming" AS ENUM ('ON_GENERATION', 'BEFORE_DEADLINE', 'ON_DEADLINE', 'AFTER_DEADLINE');

-- CreateEnum
CREATE TYPE "CriterionType" AS ENUM ('YES_NO', 'SCALE', 'TEXT');

-- CreateTable
CREATE TABLE "ReportSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "generationDays" INTEGER[],
    "useLastDayOfMonth" BOOLEAN NOT NULL DEFAULT false,
    "deadlineDays" INTEGER NOT NULL DEFAULT 7,
    "minLessons" INTEGER NOT NULL DEFAULT 2,

    CONSTRAINT "ReportSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportNotificationRule" (
    "id" SERIAL NOT NULL,
    "settingsId" INTEGER NOT NULL DEFAULT 1,
    "days" INTEGER,
    "timing" "NotificationTiming" NOT NULL,
    "time" TEXT NOT NULL,
    "messageText" TEXT NOT NULL,

    CONSTRAINT "ReportNotificationRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportTemplate" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "body" TEXT NOT NULL,

    CONSTRAINT "ReportTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportCriterion" (
    "id" SERIAL NOT NULL,
    "templateId" INTEGER NOT NULL DEFAULT 1,
    "name" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "type" "CriterionType" NOT NULL,

    CONSTRAINT "ReportCriterion_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ReportNotificationRule" ADD CONSTRAINT "ReportNotificationRule_settingsId_fkey" FOREIGN KEY ("settingsId") REFERENCES "ReportSettings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportCriterion" ADD CONSTRAINT "ReportCriterion_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ReportTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
